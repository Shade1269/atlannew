import json
import math
import os
import struct
from typing import List, Optional, Sequence, Tuple

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'models')

def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def pack_floats(values: Sequence[float]) -> bytes:
    return struct.pack('<' + 'f' * len(values), *values)


def pad_bytes(data: bytes, pad_char: bytes = b' ') -> bytes:
    padding = (4 - (len(data) % 4)) % 4
    return data + pad_char * padding


def build_glb(positions: List[float], normals: List[float], color: Tuple[float, float, float, float], *,
              metallic: float = 0.1, roughness: float = 0.4, name: str = "Model") -> bytes:
    pos_bytes = pack_floats(positions)
    normal_bytes = pack_floats(normals)

    buffer_views = []
    accessors = []

    offset = 0
    pos_view = {
        "buffer": 0,
        "byteOffset": offset,
        "byteLength": len(pos_bytes),
        "target": 34962,
    }
    buffer_views.append(pos_view)
    count = len(positions) // 3
    min_vals = [min(positions[i::3]) for i in range(3)]
    max_vals = [max(positions[i::3]) for i in range(3)]
    accessors.append({
        "bufferView": len(buffer_views) - 1,
        "componentType": 5126,
        "count": count,
        "type": "VEC3",
        "min": min_vals,
        "max": max_vals,
    })
    offset += len(pos_bytes)

    normal_view = {
        "buffer": 0,
        "byteOffset": offset,
        "byteLength": len(normal_bytes),
        "target": 34962,
    }
    buffer_views.append(normal_view)
    accessors.append({
        "bufferView": len(buffer_views) - 1,
        "componentType": 5126,
        "count": count,
        "type": "VEC3",
    })
    offset += len(normal_bytes)

    binary_data = pos_bytes + normal_bytes
    padded_binary = pad_bytes(binary_data, b'\x00')

    json_dict = {
        "asset": {"generator": "scripts/generate_models.py", "version": "2.0"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": name}],
        "meshes": [{
            "name": name,
            "primitives": [{
                "attributes": {
                    "POSITION": 0,
                    "NORMAL": 1,
                },
                "mode": 4,
                "material": 0,
            }]
        }],
        "materials": [{
            "name": f"{name}Material",
            "pbrMetallicRoughness": {
                "baseColorFactor": list(color),
                "metallicFactor": metallic,
                "roughnessFactor": roughness,
            }
        }],
        "buffers": [{"byteLength": len(padded_binary)}],
        "bufferViews": buffer_views,
        "accessors": accessors,
    }

    json_bytes = json.dumps(json_dict, separators=(',', ':')).encode('utf-8')
    padded_json = pad_bytes(json_bytes, b' ')

    total_length = 12 + 8 + len(padded_json) + 8 + len(padded_binary)

    header = struct.pack('<4sII', b'glTF', 2, total_length)
    json_chunk = struct.pack('<I4s', len(padded_json), b'JSON') + padded_json
    bin_chunk = struct.pack('<I4s', len(padded_binary), b'BIN\x00') + padded_binary

    return header + json_chunk + bin_chunk


def add_triangle(triangles: List[float], normals: List[float], verts: Sequence[Tuple[float, float, float]], normal: Optional[Tuple[float, float, float]] = None) -> None:
    if normal is None:
        ax, ay, az = verts[0]
        bx, by, bz = verts[1]
        cx, cy, cz = verts[2]
        ux, uy, uz = bx - ax, by - ay, bz - az
        vx, vy, vz = cx - ax, cy - ay, cz - az
        nx = uy * vz - uz * vy
        ny = uz * vx - ux * vz
        nz = ux * vy - uy * vx
        length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        normal = (nx / length, ny / length, nz / length)
    for vx, vy, vz in verts:
        triangles.extend([vx, vy, vz])
        normals.extend(list(normal))


def build_cube() -> Tuple[List[float], List[float]]:
    positions: List[float] = []
    normals: List[float] = []
    faces = [
        # +X
        ((0.5, -0.5, -0.5), (0.5, 0.5, -0.5), (0.5, 0.5, 0.5), (0.5, -0.5, 0.5), (1, 0, 0)),
        # -X
        ((-0.5, -0.5, 0.5), (-0.5, 0.5, 0.5), (-0.5, 0.5, -0.5), (-0.5, -0.5, -0.5), (-1, 0, 0)),
        # +Y
        ((-0.5, 0.5, -0.5), (-0.5, 0.5, 0.5), (0.5, 0.5, 0.5), (0.5, 0.5, -0.5), (0, 1, 0)),
        # -Y
        ((-0.5, -0.5, 0.5), (-0.5, -0.5, -0.5), (0.5, -0.5, -0.5), (0.5, -0.5, 0.5), (0, -1, 0)),
        # +Z
        ((-0.5, -0.5, 0.5), (0.5, -0.5, 0.5), (0.5, 0.5, 0.5), (-0.5, 0.5, 0.5), (0, 0, 1)),
        # -Z
        ((0.5, -0.5, -0.5), (-0.5, -0.5, -0.5), (-0.5, 0.5, -0.5), (0.5, 0.5, -0.5), (0, 0, -1)),
    ]
    for v0, v1, v2, v3, normal in faces:
        add_triangle(positions, normals, (v0, v1, v2), normal)
        add_triangle(positions, normals, (v0, v2, v3), normal)
    return positions, normals


def build_icosahedron() -> Tuple[List[float], List[float]]:
    phi = (1 + math.sqrt(5)) / 2
    s = 1 / math.sqrt(1 + phi * phi)
    t = phi * s
    vertices = [
        (-s, t, 0), (s, t, 0), (-s, -t, 0), (s, -t, 0),
        (0, -s, t), (0, s, t), (0, -s, -t), (0, s, -t),
        (t, 0, -s), (t, 0, s), (-t, 0, -s), (-t, 0, s)
    ]
    faces = [
        (0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11),
        (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
        (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9),
        (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)
    ]
    positions: List[float] = []
    normals: List[float] = []
    for a, b, c in faces:
        v0 = vertices[a]
        v1 = vertices[b]
        v2 = vertices[c]
        normal0 = normalize(v0)
        normal1 = normalize(v1)
        normal2 = normalize(v2)
        add_triangle(positions, normals, (scale(normalize(v0), 0.75), scale(normalize(v1), 0.75), scale(normalize(v2), 0.75)), normalize(tuple_sum(normal0, normal1, normal2)))
    return positions, normals


def scale(vec: Tuple[float, float, float], factor: float) -> Tuple[float, float, float]:
    return (vec[0] * factor, vec[1] * factor, vec[2] * factor)


def tuple_sum(*vecs: Tuple[float, float, float]) -> Tuple[float, float, float]:
    x = sum(v[0] for v in vecs)
    y = sum(v[1] for v in vecs)
    z = sum(v[2] for v in vecs)
    return (x, y, z)


def normalize(vec: Tuple[float, float, float]) -> Tuple[float, float, float]:
    x, y, z = vec
    length = math.sqrt(x * x + y * y + z * z) or 1.0
    return (x / length, y / length, z / length)


def build_pyramid() -> Tuple[List[float], List[float]]:
    positions: List[float] = []
    normals: List[float] = []
    apex = (0.0, 0.75, 0.0)
    base = [
        (-0.75, -0.5, -0.75),
        (0.75, -0.5, -0.75),
        (0.75, -0.5, 0.75),
        (-0.75, -0.5, 0.75),
    ]
    # Base (two triangles)
    add_triangle(positions, normals, (base[0], base[1], base[2]), (0, -1, 0))
    add_triangle(positions, normals, (base[0], base[2], base[3]), (0, -1, 0))
    # Sides
    side_faces = [
        (base[0], base[1], apex),
        (base[1], base[2], apex),
        (base[2], base[3], apex),
        (base[3], base[0], apex),
    ]
    for v0, v1, v2 in side_faces:
        add_triangle(positions, normals, (v0, v1, v2))
    return positions, normals


def write_model(filename: str, positions: List[float], normals: List[float], color: Tuple[float, float, float, float], *, name: str,
                metallic: float, roughness: float) -> None:
    glb_bytes = build_glb(positions, normals, color, metallic=metallic, roughness=roughness, name=name)
    ensure_dir(OUTPUT_DIR)
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'wb') as fh:
        fh.write(glb_bytes)
    print(f"Wrote {filepath} ({len(glb_bytes)} bytes)")


def main() -> None:
    cube_positions, cube_normals = build_cube()
    sphere_positions, sphere_normals = build_icosahedron()
    pyramid_positions, pyramid_normals = build_pyramid()

    write_model('cube.glb', cube_positions, cube_normals, (0.35, 0.65, 1.0, 1.0), name='Cube', metallic=0.2, roughness=0.35)
    write_model('sphere.glb', sphere_positions, sphere_normals, (1.0, 0.55, 0.3, 1.0), name='Sphere', metallic=0.1, roughness=0.5)
    write_model('model.glb', pyramid_positions, pyramid_normals, (0.8, 0.75, 0.4, 1.0), name='DamascusRelic', metallic=0.25, roughness=0.6)


if __name__ == '__main__':
    main()
