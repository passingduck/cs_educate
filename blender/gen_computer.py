"""맥미니풍 IPC 케이스 — 전문가급 GLB 에셋 생성 (Blender headless)

기존 절차적(three.js) 모델과 같은 치수(4 x 1.15 x 4, 중심 y=0.62)로 만들어
씬 코드의 카메라/LED/라벨 좌표를 그대로 쓸 수 있게 한다.
Y-up 좌표는 GLTF 익스포터가 변환하므로 여기서는 Blender 기본(Z-up)로 작업.
three.js (x, y, z) → blender (x, -z, y)
"""
import bpy
import math

OUT = "/home/sungjin/workspace/cs_educate/public/models/computer.glb"

# ---------- 초기화 ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mat_principled(name, color, metallic=0.0, roughness=0.5, coat=0.0, emission=None, emission_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if coat and "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
        if "Coat Roughness" in bsdf.inputs:
            bsdf.inputs["Coat Roughness"].default_value = 0.1
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m


# 살짝 거칠게 하고 클리어코트를 올려 '아노다이즈드 알루미늄' 느낌 (환경 반사가 부드럽게 미끄러짐)
ALU = mat_principled("aluminum", (0.58, 0.62, 0.68), metallic=0.92, roughness=0.28, coat=0.4)
DARK = mat_principled("dark_plastic", (0.04, 0.045, 0.055), metallic=0.1, roughness=0.6)
PORT = mat_principled("port_inner", (0.015, 0.018, 0.022), metallic=0.2, roughness=0.85)
GLOW = mat_principled("logo_glow", (0.05, 0.5, 0.8), roughness=0.3,
                      emission=(0.3, 0.78, 1.0), emission_strength=1.8)


def add_cube(name, size, loc, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = size  # 기본 큐브 edge=1 → scale이 곧 치수
    bpy.ops.object.transform_apply(scale=True)
    if mat:
        o.data.materials.append(mat)
    return o


def add_cyl(name, r, depth, loc, mat, rot=None, verts=48):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    if rot:
        o.rotation_euler = rot
        bpy.ops.object.transform_apply(rotation=True)
    if mat:
        o.data.materials.append(mat)
    return o


def boolean_cut(target, cutter):
    mod = target.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


# ---------- 본체 (three: 4 x 1.15 x 4, 중심 y 0.62 → blender z 0.62) ----------
body = add_cube("body", (4, 4, 1.15), (0, 0, 0.62), ALU)

# 모서리 라운드: 베벨 (three 버전의 radius 0.28과 동일한 느낌)
bev = body.modifiers.new("bevel", "BEVEL")
bev.width = 0.24
bev.segments = 7
bev.limit_method = "ANGLE"
bpy.context.view_layer.objects.active = body
bpy.ops.object.modifier_apply(modifier="bevel")

# ---------- 후면 포트 (불리언으로 실제 음각) — three의 -z면 = blender +y면 ----------
# USB-A x4
for i, x in enumerate([-1.1, -0.6, -0.1, 0.4]):
    c = add_cube(f"usb{i}", (0.34, 0.3, 0.16), (x, 1.95, 0.55), None)
    boolean_cut(body, c)
# 원형 전원 잭
c = add_cyl("pwr", 0.1, 0.3, (1.2, 1.95, 0.55), None, rot=(math.pi / 2, 0, 0), verts=24)
boolean_cut(body, c)
# HDMI 와이드 슬롯
c = add_cube("hdmi", (0.5, 0.3, 0.12), (-1.1, 1.95, 0.88), None)
boolean_cut(body, c)
# LAN
c = add_cube("lan", (0.32, 0.3, 0.26), (-0.45, 1.95, 0.86), None)
boolean_cut(body, c)

# 포트 안쪽 어두운 내벽 (음각 안에 살짝 작게)
for i, x in enumerate([-1.1, -0.6, -0.1, 0.4]):
    add_cube(f"usbin{i}", (0.33, 0.06, 0.15), (x, 1.93, 0.55), PORT)
add_cyl("pwrin", 0.095, 0.06, (1.2, 1.93, 0.55), PORT, rot=(math.pi / 2, 0, 0), verts=24)
add_cube("hdmiin", (0.49, 0.06, 0.11), (-1.1, 1.93, 0.88), PORT)
add_cube("lanin", (0.31, 0.06, 0.25), (-0.45, 1.93, 0.86), PORT)

# ---------- 측면 통풍구 슬릿 (불리언 음각) — three +x면 = blender +x면 ----------
for i in range(9):
    y = -1.0 + i * 0.25  # three z → blender -y지만 대칭이라 그대로
    c = add_cube(f"vent{i}", (0.3, 0.07, 0.6), (1.95, -y, 0.62), None)
    boolean_cut(body, c)

# ---------- 바닥 받침 ----------
add_cyl("base", 1.55, 0.12, (0, 0, 0.06), DARK)
# 바닥 고무 링
add_cyl("foot", 1.3, 0.04, (0, 0, 0.012), DARK)

# ---------- 상판 로고 링 (발광 토러스) ----------
# 상판 미세 음각 디스크 (로고 링 자리) — 링은 홈 안에 밀착
c = add_cyl("topcut", 0.58, 0.08, (0, 0, 1.225), None, verts=64)
boolean_cut(body, c)
add_cyl("topdisk", 0.575, 0.02, (0, 0, 1.182), DARK, verts=64)
bpy.ops.mesh.primitive_torus_add(major_radius=0.47, minor_radius=0.028,
                                 location=(0, 0, 1.192), major_segments=64, minor_segments=14)
ring = bpy.context.active_object
ring.name = "logo_ring"
ring.data.materials.append(GLOW)

# ---------- 스무스 셰이딩 ----------
for o in bpy.data.objects:
    if o.type == "MESH":
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.shade_smooth()
        # 각도 기반 스무딩 (베벨 모서리는 샤프하게)
        try:
            bpy.ops.object.shade_auto_smooth(angle=math.radians(38))
        except Exception:
            pass
        o.select_set(False)

# ---------- GLB 내보내기 ----------
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True,
                          export_yup=True)
print("EXPORTED:", OUT)
