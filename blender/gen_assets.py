"""아기자기하지만 전문가가 다듬은 교육용 에셋 (Blender headless)
- kitchen_set.glb : pan(레지스터)/table(SRAM)/fridge(DRAM)/mart(SSD)
- factory.glb     : 컴파일러 공장
- cpu_package.glb : CPU 패키지
- dimm.glb        : DRAM 모듈
모든 메시는 풍부한 베벨 + 스무스 셰이딩, PBR(+클리어코트)로 환경 반사를 받게 한다.
각 오브젝트는 원점 기준 1개 메시로 join. 좌표/이름은 씬 코드와 호환 유지.
"""
import bpy
import math

OUTDIR = "/home/sungjin/workspace/cs_educate/public/models/"


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, metallic=0.0, roughness=0.55, coat=0.0, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    for key, val in (("Coat Weight", coat), ("Coat Roughness", 0.12)):
        if key in b.inputs and (key != "Coat Roughness" or coat > 0):
            b.inputs[key].default_value = val
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1.0)
        b.inputs["Emission Strength"].default_value = strength
    return m


def cube(size, loc, material, name="part", bevel_w=0.025, bevel_seg=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel_w:
        b = o.modifiers.new("bv", "BEVEL")
        b.width = bevel_w
        b.segments = bevel_seg
        b.limit_method = "ANGLE"
        b.angle_limit = math.radians(40)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier="bv")
    o.data.materials.append(material)
    return o


def cyl(r, depth, loc, material, rot=None, verts=40, r2=None, name="part"):
    if r2 is not None:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, location=loc, vertices=verts)
    else:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    if rot:
        o.rotation_euler = rot
        bpy.ops.object.transform_apply(rotation=True)
    o.data.materials.append(material)
    return o


def sphere(r, loc, material, name="part"):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=16)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    return o


def torus(major, minor, loc, material, rot=None, name="part"):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, location=loc,
                                     major_segments=48, minor_segments=18)
    o = bpy.context.active_object
    o.name = name
    if rot:
        o.rotation_euler = rot
        bpy.ops.object.transform_apply(rotation=True)
    o.data.materials.append(material)
    return o


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    j = bpy.context.active_object
    j.name = name
    bpy.ops.object.shade_smooth()
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(34))
    except Exception:
        pass
    return j


def export(path):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_apply=True, export_yup=True)
    print("EXPORTED:", path)


# ============================================================
# 1) 주방 세트 — 메모리 계층 비유 (대폭 폴리시)
# ============================================================
reset()

CAST_IRON = mat("cast_iron", (0.07, 0.075, 0.085), metallic=0.55, roughness=0.42, coat=0.15)
STEEL = mat("steel", (0.62, 0.66, 0.72), metallic=0.9, roughness=0.3, coat=0.2)
WOOD_H = mat("wood_handle", (0.34, 0.2, 0.11), roughness=0.55, coat=0.1)
EGGW = mat("egg_white", (0.97, 0.96, 0.92), roughness=0.32, coat=0.25)
YOLK = mat("yolk", (1.0, 0.68, 0.12), roughness=0.28, coat=0.4, emission=(1.0, 0.55, 0.05), strength=0.25)

# --- 프라이팬 (레지스터) ---
parts = []
base = cyl(0.56, 0.09, (0, 0, 0.30), CAST_IRON, name="pan_base")
parts.append(base)
# 바깥벽(라운드 림): 토러스로 부드러운 테두리
parts.append(torus(0.55, 0.07, (0, 0, 0.34), CAST_IRON, name="pan_rim"))
# 안쪽 살짝 오목 (조리면)
parts.append(cyl(0.5, 0.05, (0, 0, 0.315), CAST_IRON, name="pan_inner"))
# 손잡이 + 걸이구멍 느낌
h = cube((0.62, 0.1, 0.05), (0.82, 0, 0.36), WOOD_H, name="pan_handle", bevel_w=0.022, bevel_seg=4)
parts.append(h)
parts.append(cyl(0.05, 0.06, (1.16, 0, 0.36), WOOD_H, rot=(math.pi / 2, 0, 0), verts=20, name="pan_knob"))
# 계란 후라이
parts.append(cyl(0.24, 0.03, (0.04, 0.05, 0.355), EGGW, verts=28, name="egg"))
parts.append(sphere(0.085, (0.0, 0.02, 0.375), YOLK, name="yolk"))
join(parts, "pan")

# --- 식탁 (SRAM) ---
TOP = mat("table_top", (0.74, 0.52, 0.31), roughness=0.42, coat=0.12)
LEG = mat("table_leg", (0.46, 0.3, 0.17), roughness=0.5)
PLATE = mat("plate", (0.92, 0.93, 0.95), roughness=0.22, coat=0.3)
TOMATO = mat("tomato", (0.86, 0.16, 0.11), roughness=0.3, coat=0.35)
GREEN = mat("greenbox", (0.4, 0.66, 0.36), roughness=0.5)
parts = []
parts.append(cube((1.5, 1.0, 0.1), (0, 0, 0.8), TOP, name="ttop", bevel_w=0.035, bevel_seg=4))
parts.append(cube((1.46, 0.96, 0.04), (0, 0, 0.74), LEG, name="tapron", bevel_w=0.02))  # 상판 밑 에이프런
for sx in (-0.62, 0.62):
    for sy in (-0.36, 0.36):
        parts.append(cyl(0.055, 0.74, (sx, sy, 0.37), LEG, r2=0.04, verts=16, name="tleg"))  # 살짝 테이퍼
# 스트레처(다리 연결 가로대)
parts.append(cube((1.2, 0.05, 0.04), (0, -0.36, 0.2), LEG, name="str1", bevel_w=0.012))
parts.append(cube((1.2, 0.05, 0.04), (0, 0.36, 0.2), LEG, name="str2", bevel_w=0.012))
# 접시 + 토마토 + 채소 상자
parts.append(cyl(0.22, 0.025, (0.34, 0.16, 0.855), PLATE, verts=32, name="plate"))
parts.append(cyl(0.16, 0.02, (0.34, 0.16, 0.87), PLATE, verts=32, name="plate2"))
parts.append(sphere(0.1, (0.34, 0.16, 0.94), TOMATO, name="tom"))
parts.append(cube((0.34, 0.24, 0.14), (-0.4, -0.06, 0.92), GREEN, name="gbox", bevel_w=0.02, bevel_seg=3))
join(parts, "table")

# --- 냉장고 (DRAM) — 스테인리스 2도어 ---
FR = mat("fridge_body", (0.7, 0.74, 0.78), metallic=0.85, roughness=0.3, coat=0.35)
SEAM = mat("fridge_seam", (0.32, 0.36, 0.4), metallic=0.5, roughness=0.4)
HANDLE = mat("fridge_handle", (0.3, 0.33, 0.37), metallic=0.9, roughness=0.25, coat=0.3)
NOTE = mat("note", (1.0, 0.86, 0.35), roughness=0.6)
parts = []
parts.append(cube((0.96, 0.8, 1.82), (0, 0, 0.92), FR, name="fr_body", bevel_w=0.07, bevel_seg=6))
# 도어 분리 홈 (가로) — 위 냉동/아래 냉장
parts.append(cube((0.99, 0.06, 0.025), (0, -0.39, 1.28), SEAM, name="fr_seam_h", bevel_w=0.008))
# 도어 세로 살짝 함몰 라인 (가운데)
parts.append(cube((0.025, 0.06, 1.7), (0, -0.39, 0.92), SEAM, name="fr_seam_v", bevel_w=0.006))
# 손잡이 2개 (세로 바 + 스탠드오프)
for z0, length in ((1.55, 0.34), (0.78, 0.6)):
    parts.append(cube((0.05, 0.06, length), (0.34, -0.45, z0), HANDLE, name="fr_handle", bevel_w=0.012, bevel_seg=3))
    for dz in (length / 2 - 0.05, -(length / 2 - 0.05)):
        parts.append(cyl(0.018, 0.06, (0.34, -0.42, z0 + dz), HANDLE, rot=(math.pi / 2, 0, 0), verts=10, name="fr_so"))
# 발
for sx in (-0.4, 0.4):
    for sy in (-0.32, 0.32):
        parts.append(cyl(0.05, 0.06, (sx, sy, 0.02), SEAM, verts=12, name="fr_foot"))
# 메모지 + 자석
parts.append(cube((0.16, 0.012, 0.2), (-0.18, -0.405, 1.0), NOTE, name="fr_note", bevel_w=0.004))
parts.append(cyl(0.03, 0.02, (-0.18, -0.41, 1.12), TOMATO, rot=(math.pi / 2, 0, 0), verts=14, name="fr_magnet"))
join(parts, "fridge")

# --- 마트 (SSD) — 줄무늬 차양 + 유리문 ---
WALL = mat("mart_wall", (0.92, 0.87, 0.78), roughness=0.6)
TRIM = mat("mart_trim", (0.7, 0.64, 0.55), roughness=0.55)
AWN_R = mat("awning_red", (0.82, 0.28, 0.24), roughness=0.5, coat=0.1)
AWN_W = mat("awning_white", (0.93, 0.9, 0.85), roughness=0.5, coat=0.1)
SIGN = mat("sign", (0.2, 0.5, 0.85), roughness=0.4, emission=(0.3, 0.62, 1.0), strength=1.3)
GLASS = mat("mart_glass", (0.3, 0.45, 0.6), metallic=0.4, roughness=0.12, coat=0.5)
FRAME = mat("mart_frame", (0.45, 0.48, 0.52), metallic=0.7, roughness=0.35)
parts = []
parts.append(cube((2.0, 1.4, 1.1), (0, 0, 0.56), WALL, name="m_wall", bevel_w=0.05, bevel_seg=4))
# 지붕 트림
parts.append(cube((2.08, 1.46, 0.12), (0, 0, 1.14), TRIM, name="m_roof", bevel_w=0.03))
# 줄무늬 차양 (앞면 -y), 각도 살짝
n_slats = 9
for i in range(n_slats):
    x = -0.9 + i * (1.8 / (n_slats - 1))
    m = AWN_R if i % 2 == 0 else AWN_W
    a = cube((1.8 / n_slats * 0.92, 0.5, 0.05), (x, -0.86, 1.0), m, name="awn", bevel_w=0.01)
    a.rotation_euler = (math.radians(14), 0, 0)
    bpy.context.view_layer.objects.active = a
    bpy.ops.object.transform_apply(rotation=True)
    parts.append(a)
# 차양 앞 늘어지는 스캘럽 단
parts.append(cube((1.85, 0.06, 0.12), (0, -1.04, 0.92), AWN_R, name="awn_edge", bevel_w=0.02))
# 간판
parts.append(cube((1.5, 0.12, 0.32), (0, -0.7, 1.34), SIGN, name="m_sign", bevel_w=0.03))
# 쇼윈도 (프레임 + 유리 + 멀리언)
parts.append(cube((0.9, 0.05, 0.6), (0.5, -0.71, 0.62), FRAME, name="m_winframe", bevel_w=0.01))
parts.append(cube((0.82, 0.03, 0.52), (0.5, -0.72, 0.62), GLASS, name="m_winglass", bevel_w=0.005))
parts.append(cube((0.03, 0.04, 0.52), (0.5, -0.72, 0.62), FRAME, name="m_mull_v", bevel_w=0.004))
parts.append(cube((0.82, 0.04, 0.03), (0.5, -0.72, 0.62), FRAME, name="m_mull_h", bevel_w=0.004))
# 유리문 (프레임 + 유리 + 손잡이)
parts.append(cube((0.52, 0.05, 0.86), (-0.45, -0.71, 0.45), FRAME, name="m_doorframe", bevel_w=0.01))
parts.append(cube((0.44, 0.03, 0.78), (-0.45, -0.72, 0.45), GLASS, name="m_doorglass", bevel_w=0.005))
parts.append(cyl(0.02, 0.3, (-0.32, -0.74, 0.45), FRAME, verts=10, name="m_doorhandle"))
join(parts, "mart")

export(OUTDIR + "kitchen_set.glb")

# ============================================================
# 2) 컴파일러 공장 (베벨/디테일 보강)
# ============================================================
reset()
BODY = mat("fbody", (0.34, 0.44, 0.6), metallic=0.3, roughness=0.42, coat=0.2)
ACC = mat("facc", (0.95, 0.63, 0.2), metallic=0.4, roughness=0.4, coat=0.15)
DARKM = mat("fdark", (0.13, 0.15, 0.18), metallic=0.6, roughness=0.4)
GEAR = mat("fgear", (0.72, 0.76, 0.8), metallic=0.92, roughness=0.3, coat=0.2)
LAMP = mat("flamp", (0.3, 1, 0.45), emission=(0.3, 1, 0.45), strength=2.4)
parts = []
parts.append(cube((1.6, 1.2, 1.1), (0, 0, 0.55), BODY, name="f_body", bevel_w=0.08, bevel_seg=5))
parts.append(cube((1.66, 1.26, 0.12), (0, 0, 1.12), DARKM, name="f_top", bevel_w=0.03))  # 상판 트림
parts.append(cyl(0.55, 0.5, (-0.45, 0, 1.5), DARKM, r2=0.18, verts=32, name="f_funnel"))
parts.append(cyl(0.58, 0.06, (-0.45, 0, 1.74), ACC, verts=32, name="f_funnel_lip"))
ch = cube((0.5, 0.45, 0.08), (0.85, 0, 0.45), DARKM, name="f_chute", bevel_w=0.015)
ch.rotation_euler = (0, math.radians(-25), 0)
bpy.context.view_layer.objects.active = ch
bpy.ops.object.transform_apply(rotation=True)
parts.append(ch)
parts.append(cyl(0.12, 0.5, (0.45, 0.3, 1.32), ACC, verts=20, name="f_stack"))
parts.append(cyl(0.14, 0.06, (0.45, 0.3, 1.58), ACC, verts=20, name="f_stack_lip"))
parts.append(torus(0.3, 0.09, (0, -0.66, 0.7), GEAR, rot=(math.pi / 2, 0, 0), name="f_gear"))
for i in range(8):
    ang = i * math.pi / 4
    parts.append(cube((0.1, 0.09, 0.12), (0.38 * math.cos(ang), -0.66, 0.7 + 0.38 * math.sin(ang)), GEAR, name="f_tooth", bevel_w=0.01))
parts.append(cyl(0.07, 0.04, (0.55, -0.61, 1.0), LAMP, rot=(math.pi / 2, 0, 0), verts=14, name="f_lamp"))
join(parts, "factory")
export(OUTDIR + "factory.glb")

# ============================================================
# 3) CPU 패키지 (디테일 보강)
# ============================================================
reset()
SUB = mat("sub", (0.09, 0.3, 0.22), roughness=0.45, coat=0.1)
IHS = mat("ihs", (0.76, 0.79, 0.84), metallic=0.94, roughness=0.22, coat=0.35)
GOLD = mat("gold", (0.86, 0.67, 0.26), metallic=0.96, roughness=0.28, coat=0.1)
parts = []
parts.append(cube((1.5, 1.5, 0.08), (0, 0, 0.1), SUB, name="cpu_sub", bevel_w=0.02))
for i in range(10):
    for sgn in (-1, 1):
        parts.append(cube((0.075, 0.075, 0.022), (-0.63 + i * 0.14, sgn * 0.66, 0.15), GOLD, name="pad", bevel_w=0.005))
        parts.append(cube((0.075, 0.075, 0.022), (sgn * 0.66, -0.63 + i * 0.14, 0.15), GOLD, name="pad", bevel_w=0.005))
parts.append(cube((1.18, 0.8, 0.14), (0, 0, 0.22), IHS, name="ihs1", bevel_w=0.04, bevel_seg=4))
parts.append(cube((0.8, 1.18, 0.14), (0, 0, 0.22), IHS, name="ihs2", bevel_w=0.04, bevel_seg=4))
parts.append(cube((0.78, 0.78, 0.03), (0, 0, 0.3), mat("ihstop", (0.83, 0.86, 0.9), metallic=0.95, roughness=0.16, coat=0.4), name="ihstop", bevel_w=0.02))
for x in (-0.5, -0.3, 0.3, 0.5):
    parts.append(cube((0.1, 0.05, 0.03), (x, 0.58, 0.16), GOLD, name="smd", bevel_w=0.005))
join(parts, "cpu_package")
export(OUTDIR + "cpu_package.glb")

# ============================================================
# 4) DIMM 모듈
# ============================================================
reset()
PCB = mat("dpcb", (0.05, 0.18, 0.26), roughness=0.45, coat=0.08)
CHIP = mat("dchip", (0.07, 0.08, 0.1), metallic=0.35, roughness=0.38, coat=0.12)
GOLD2 = mat("dgold", (0.86, 0.67, 0.26), metallic=0.96, roughness=0.28)
parts = []
parts.append(cube((0.07, 2.6, 1.3), (0, 0, 0.72), PCB, name="d_pcb", bevel_w=0.015, bevel_seg=2))
for j in range(8):
    y = -1.12 + j * 0.3 + (0.1 if j >= 4 else 0)
    parts.append(cube((0.045, 0.24, 0.62), (0.05, y, 0.74), CHIP, name="d_chip", bevel_w=0.012, bevel_seg=2))
for j in range(20):
    y = -1.2 + j * 0.126
    if abs(y - 0.05) < 0.1:
        continue
    parts.append(cube((0.075, 0.09, 0.22), (0, y, 0.18), GOLD2, name="d_finger", bevel_w=0.004))
join(parts, "dimm")
export(OUTDIR + "dimm.glb")
