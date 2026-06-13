"""아기자기한 교육용 에셋 4종 생성 (Blender headless)
- kitchen_set.glb : pan(레지스터)/table(SRAM)/fridge(DRAM)/mart(SSD)
- factory.glb     : 컴파일러 공장 (깔때기+기어+굴뚝)
- cpu_package.glb : CPU 패키지 (기판+골드 패드+십자 IHS)
- dimm.glb        : DRAM 모듈
각 오브젝트는 원점 기준, 바닥 z=0. 메시는 오브젝트당 1개로 join.
"""
import bpy
import math

OUTDIR = "/home/sungjin/workspace/cs_educate/public/models/"


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, metallic=0.0, roughness=0.55, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1.0)
        b.inputs["Emission Strength"].default_value = strength
    return m


def cube(size, loc, material, name="part"):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    return o


def cyl(r, depth, loc, material, rot=None, verts=32, r2=None, name="part"):
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


def bevel(o, width=0.03, segments=3):
    m = o.modifiers.new("bv", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier="bv")


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = name
    bpy.ops.object.shade_smooth()
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
    except Exception:
        pass
    return joined


def export(path):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_apply=True, export_yup=True)
    print("EXPORTED:", path)


# ============================================================
# 1) 주방 세트 — 메모리 계층 비유
# ============================================================
reset()

# --- 프라이팬 (레지스터: 조리 중인 재료) ---
PAN = mat("pan", (0.13, 0.14, 0.16), metallic=0.6, roughness=0.4)
WOOD = mat("wood", (0.45, 0.28, 0.15), roughness=0.7)
EGGW = mat("eggw", (0.95, 0.94, 0.9), roughness=0.4)
YOLK = mat("yolk", (1.0, 0.7, 0.1), roughness=0.35, emission=(1.0, 0.6, 0.05), strength=0.4)
parts = []
p = cyl(0.55, 0.1, (0, 0, 0.3), PAN)
bevel(p, 0.025)
parts.append(p)
rim = cyl(0.55, 0.12, (0, 0, 0.38), PAN)  # 테두리
inner = cyl(0.48, 0.2, (0, 0, 0.42), PAN)
b = rim.modifiers.new("cut", "BOOLEAN"); b.operation = "DIFFERENCE"; b.object = inner
bpy.context.view_layer.objects.active = rim
bpy.ops.object.modifier_apply(modifier="cut")
bpy.data.objects.remove(inner, do_unlink=True)
parts.append(rim)
h = cube((0.65, 0.12, 0.06), (0.85, 0, 0.36), WOOD); bevel(h, 0.02); parts.append(h)
# 계란 후라이 (조리 중!)
e = cyl(0.22, 0.035, (0.05, 0.05, 0.37), EGGW, verts=24); bevel(e, 0.015); parts.append(e)
parts.append(cyl(0.08, 0.06, (0.02, 0.03, 0.39), YOLK, verts=20))
# 받침 화구
parts.append(cyl(0.4, 0.25, (0, 0, 0.125), mat("stove", (0.2, 0.21, 0.24), metallic=0.4, roughness=0.5)))
join(parts, "pan")

# --- 식탁 (SRAM) ---
TOP = mat("ttop", (0.72, 0.5, 0.3), roughness=0.5)
LEG = mat("tleg", (0.5, 0.33, 0.18), roughness=0.6)
parts = []
t = cube((1.5, 1.0, 0.09), (0, 0, 0.78), TOP); bevel(t, 0.03); parts.append(t)
for sx in (-0.62, 0.62):
    for sy in (-0.36, 0.36):
        parts.append(cyl(0.05, 0.75, (sx, sy, 0.375), LEG, verts=12))
# 접시 + 재료(토마토)
parts.append(cyl(0.2, 0.03, (0.35, 0.15, 0.84), mat("plate", (0.9, 0.9, 0.92), roughness=0.3), verts=24))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(0.35, 0.15, 0.91), segments=16, ring_count=12)
tom = bpy.context.active_object
tom.data.materials.append(mat("tomato", (0.85, 0.15, 0.1), roughness=0.35))
parts.append(tom)
parts.append(cube((0.3, 0.2, 0.12), (-0.4, -0.1, 0.89), mat("box1", (0.4, 0.65, 0.35), roughness=0.55)))
join(parts, "table")

# --- 냉장고 (DRAM) ---
FR = mat("fridge", (0.75, 0.88, 0.86), metallic=0.25, roughness=0.35)
FRD = mat("fridge_d", (0.6, 0.75, 0.73), metallic=0.3, roughness=0.4)
parts = []
f = cube((0.95, 0.8, 1.8), (0, 0, 0.9), FR); bevel(f, 0.05, 4); parts.append(f)
# 문 분리선 + 손잡이
parts.append(cube((0.97, 0.78, 0.02), (0, 0, 1.25), FRD))
parts.append(cube((0.05, 0.06, 0.35), (0.32, -0.43, 1.5), FRD))
parts.append(cube((0.05, 0.06, 0.5), (0.32, -0.43, 0.75), FRD))
parts.append(cyl(0.04, 0.06, (-0.35, -0.42, 0.32), FRD, rot=(math.pi / 2, 0, 0), verts=12))  # 자석
join(parts, "fridge")

# --- 마트 (SSD) ---
WALL = mat("mwall", (0.93, 0.88, 0.8), roughness=0.6)
AWN = mat("awning", (0.85, 0.3, 0.25), roughness=0.55)
SIGN = mat("sign", (0.25, 0.55, 0.85), roughness=0.4, emission=(0.3, 0.6, 1.0), strength=0.8)
DOOR = mat("mdoor", (0.35, 0.55, 0.75), metallic=0.3, roughness=0.3)
parts = []
w = cube((2.0, 1.4, 1.1), (0, 0, 0.55), WALL); bevel(w, 0.04); parts.append(w)
# 간판
s = cube((1.7, 0.15, 0.35), (0, -0.65, 1.32), SIGN); bevel(s, 0.03); parts.append(s)
# 차양 (어닝)
a = cube((1.9, 0.45, 0.05), (0, -0.85, 1.02), AWN)
a.rotation_euler = (math.radians(12), 0, 0)
bpy.ops.object.transform_apply(rotation=True)
parts.append(a)
# 문 + 창
parts.append(cube((0.45, 0.05, 0.75), (-0.45, -0.71, 0.375), DOOR))
parts.append(cube((0.7, 0.05, 0.5), (0.45, -0.71, 0.6), DOOR))
join(parts, "mart")
export(OUTDIR + "kitchen_set.glb")

# ============================================================
# 2) 컴파일러 공장
# ============================================================
reset()
BODY = mat("fbody", (0.35, 0.45, 0.62), metallic=0.2, roughness=0.5)
ACC = mat("facc", (0.95, 0.65, 0.2), metallic=0.3, roughness=0.45)
DARKM = mat("fdark", (0.15, 0.17, 0.2), metallic=0.5, roughness=0.45)
GEAR = mat("fgear", (0.7, 0.74, 0.78), metallic=0.8, roughness=0.35)
parts = []
b0 = cube((1.6, 1.2, 1.1), (0, 0, 0.55), BODY); bevel(b0, 0.06, 4); parts.append(b0)
# 깔때기 (입력)
parts.append(cyl(0.55, 0.5, (-0.45, 0, 1.45), DARKM, r2=0.18, verts=28))
# 출력 슈트
ch = cube((0.5, 0.45, 0.08), (0.85, 0, 0.45), DARKM)
ch.rotation_euler = (0, math.radians(-25), 0)
bpy.ops.object.transform_apply(rotation=True)
parts.append(ch)
# 굴뚝
parts.append(cyl(0.12, 0.5, (0.45, 0.3, 1.3), ACC, verts=16))
# 기어 (토러스 + 이빨)
bpy.ops.mesh.primitive_torus_add(major_radius=0.3, minor_radius=0.09, location=(0, -0.65, 0.7),
                                 rotation=(math.pi / 2, 0, 0), major_segments=32, minor_segments=12)
g = bpy.context.active_object
g.data.materials.append(GEAR)
parts.append(g)
for i in range(8):
    ang = i * math.pi / 4
    parts.append(cube((0.1, 0.08, 0.12), (0.38 * math.cos(ang), -0.65, 0.7 + 0.38 * math.sin(ang)), GEAR))
# 표시등
parts.append(cyl(0.06, 0.04, (0.55, -0.61, 1.0), mat("lamp", (0.3, 1, 0.4), emission=(0.3, 1, 0.4), strength=2), rot=(math.pi / 2, 0, 0), verts=12))
join(parts, "factory")
export(OUTDIR + "factory.glb")

# ============================================================
# 3) CPU 패키지 (메인보드용)
# ============================================================
reset()
SUB = mat("sub", (0.1, 0.32, 0.24), roughness=0.5)
IHS = mat("ihs", (0.75, 0.78, 0.82), metallic=0.92, roughness=0.25)
GOLD = mat("gold", (0.85, 0.66, 0.25), metallic=0.95, roughness=0.3)
parts = []
s0 = cube((1.5, 1.5, 0.08), (0, 0, 0.1), SUB); bevel(s0, 0.02); parts.append(s0)
# 골드 패드 (가장자리 2줄)
for i in range(10):
    for sgn in (-1, 1):
        parts.append(cube((0.08, 0.08, 0.02), (-0.63 + i * 0.14, sgn * 0.66, 0.15), GOLD))
        parts.append(cube((0.08, 0.08, 0.02), (sgn * 0.66, -0.63 + i * 0.14, 0.15), GOLD))
# 십자 IHS
i1 = cube((1.18, 0.8, 0.14), (0, 0, 0.22), IHS); bevel(i1, 0.04, 4); parts.append(i1)
i2 = cube((0.8, 1.18, 0.14), (0, 0, 0.22), IHS); bevel(i2, 0.04, 4); parts.append(i2)
parts.append(cube((0.78, 0.78, 0.03), (0, 0, 0.3), mat("ihstop", (0.82, 0.85, 0.88), metallic=0.95, roughness=0.18)))
# SMD 캡
for x in (-0.5, -0.3, 0.3, 0.5):
    parts.append(cube((0.1, 0.05, 0.03), (x, 0.58, 0.16), GOLD))
join(parts, "cpu_package")
export(OUTDIR + "cpu_package.glb")

# ============================================================
# 4) DIMM 모듈 (메인보드용, 세워진 상태)
# ============================================================
reset()
PCB = mat("dpcb", (0.05, 0.18, 0.26), roughness=0.5)
CHIP = mat("dchip", (0.08, 0.09, 0.11), metallic=0.3, roughness=0.4)
GOLD2 = mat("dgold", (0.85, 0.66, 0.25), metallic=0.95, roughness=0.3)
parts = []
p0 = cube((0.07, 2.6, 1.3), (0, 0, 0.72), PCB); bevel(p0, 0.015, 2); parts.append(p0)
for j in range(8):
    y = -1.12 + j * 0.3 + (0.1 if j >= 4 else 0)
    c0 = cube((0.045, 0.24, 0.62), (0.05, y, 0.74), CHIP); bevel(c0, 0.012, 2); parts.append(c0)
for j in range(20):
    y = -1.2 + j * 0.126
    if abs(y - 0.05) < 0.1:
        continue
    parts.append(cube((0.075, 0.09, 0.22), (0, y, 0.18), GOLD2))
join(parts, "dimm")
export(OUTDIR + "dimm.glb")
