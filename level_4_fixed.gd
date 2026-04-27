import Godot
from godot import *

# Уровень 4: Два острова, вода между ними, нет лишних объектов.
# Расстояние по Z: 120 метров.
# Вода - без коллизии (триггер).
# Острова - с правильной коллизией поверхности.
# Точка посадки - на конечном острове.

@GDScript
class Level4(GDScript):
    func _ready():
        # Создаем корневой узел уровня, если его нет
        var level_root = Node3D.new()
        level_root.name = "Level4_Root"
        Engine.get_main_loop().current_scene.add_child(level_root)

        # 1. СТАРТОВЫЙ ОСТРОВ (Позиция Z = 0)
        var start_island = self._create_island(Vector3(0, -5, 0))
        start_island.name = "StartIsland"
        level_root.add_child(start_island)

        # 2. КОНЕЧНЫЙ ОСТРОВ (Позиция Z = 120)
        var end_island = self._create_island(Vector3(0, -5, 120))
        end_island.name = "EndIsland"
        level_root.add_child(end_island)

        # 3. ВОДА (Между островами, без коллизии)
        var water = self._create_water()
        water.name = "WaterPlane"
        level_root.add_child(water)

        # 4. ТОЧКА ПОСАДКИ (Строго на конечном острове)
        var landing_zone = Marker3D.new()
        landing_zone.name = "LandingZone"
        landing_zone.position = Vector3(0, 1.5, 120) # Чуть над поверхностью конечного острова
        level_root.add_child(landing_zone)
        
        # Добавим визуальный маркер зоны посадки (зеленый круг)
        var marker_mesh = MeshInstance3D.new()
        var cylinder = CylinderMesh.new()
        cylinder.radius = 3.0
        cylinder.height = 0.2
        marker_mesh.mesh = cylinder
        var mat = StandardMaterial3D.new()
        mat.albedo_color = Color(0, 1, 0, 0.8) # Зеленый полупрозрачный
        mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
        marker_mesh.material = mat
        marker_mesh.position = Vector3(0, 0.1, 120)
        level_root.add_child(marker_mesh)

        # 5. ДРОН (Спавн на стартовом острове)
        # Предполагается, что менеджер дрона существует в сцене
        var drone_spawn = Marker3D.new()
        drone_spawn.name = "DroneSpawnPoint"
        drone_spawn.position = Vector3(0, 2, 0)
        level_root.add_child(drone_spawn)

        print("Уровень 4 загружен: Старт (0,0,0) -> Финиш (0,0,120). Дом удален. Коллизии настроены.")

    # Функция создания острова с ПРАВИЛЬНОЙ коллизией
    func _create_island(pos: Vector3) -> Node3D:
        var island_group = Node3D.new()
        island_group.position = pos
        
        # Визуальная часть (земля)
        var mesh = MeshInstance3D.new()
        var box = BoxMesh.new()
        box.size = Vector3(40, 10, 40) # Широкий остров
        mesh.mesh = box
        var mat = StandardMaterial3D.new()
        mat.albedo_color = Color(0.2, 0.6, 0.1) # Зеленая трава
        mesh.material = mat
        island_group.add_child(mesh)

        # ФИЗИЧЕСКАЯ КОЛЛИЗИЯ (StaticBody)
        var body = StaticBody3D.new()
        var col_shape = CollisionShape3D.new()
        var shape = BoxShape3D.new()
        shape.size = Vector3(40, 10, 40)
        col_shape.shape = shape
        body.add_child(col_shape)
        island_group.add_child(body)

        # Декор (пальмы по углам, опционально)
        # Добавляем пальмы с полной физикой (визуализация + коллизия)
        var palm_positions = [
            Vector3(-15, 5, -15), Vector3(15, 5, -15),
            Vector3(-15, 5, 15), Vector3(15, 5, 15)
        ]
        for p in palm_positions:
            # Визуальная часть пальмы
            var palm = MeshInstance3D.new()
            var trunk = CylinderMesh.new()
            trunk.radius = 0.5
            trunk.height = 8
            palm.mesh = trunk
            var trunk_mat = StandardMaterial3D.new()
            trunk_mat.albedo_color = Color(0.4, 0.3, 0.1)
            palm.material = trunk_mat
            palm.position = p
            island_group.add_child(palm)
            
            # Крона пальмы (визуализация)
            var leaves = MeshInstance3D.new()
            var leaves_mesh = SphereMesh.new()
            leaves_mesh.radius = 2.0
            leaves.mesh = leaves_mesh
            var leaves_mat = StandardMaterial3D.new()
            leaves_mat.albedo_color = Color(0.1, 0.5, 0.1)
            leaves.material = leaves_mat
            leaves.position = p + Vector3(0, 5, 0)
            island_group.add_child(leaves)
            
            # Коллизия ствола пальмы
            var trunk_body = StaticBody3D.new()
            var trunk_col = CollisionShape3D.new()
            var trunk_shape = CylinderShape3D.new()
            trunk_shape.radius = 0.5
            trunk_shape.height = 8
            trunk_col.shape = trunk_shape
            trunk_col.position = p
            trunk_body.add_child(trunk_col)
            island_group.add_child(trunk_body)
            
            # Коллизия кроны пальмы
            var leaves_body = StaticBody3D.new()
            var leaves_col = CollisionShape3D.new()
            var leaves_shape = SphereShape3D.new()
            leaves_shape.radius = 2.0
            leaves_col.shape = leaves_shape
            leaves_col.position = p + Vector3(0, 5, 0)
            leaves_body.add_child(leaves_col)
            island_group.add_child(leaves_body)

        return island_group

    # Функция создания воды БЕЗ КОЛЛИЗИИ (Триггер)
    func _create_water() -> Area3D:
        var water_area = Area3D.new() # Используем Area3D, чтобы не было физической блокировки
        
        var mesh = MeshInstance3D.new()
        var plane = PlaneMesh.new()
        plane.size = Vector2(60, 160) # Вода покрывает пространство между островами
        mesh.mesh = plane
        var mat = StandardMaterial3D.new()
        mat.albedo_color = Color(0, 0.5, 1, 0.6) # Синяя полупрозрачная
        mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
        mesh.material = mat
        mesh.rotation.x = -PI / 2 # Положить горизонтально
        mesh.position.y = -2 # Уровень воды чуть ниже поверхности островов
        water_area.add_child(mesh)

        # Добавляем CollisionShape для триггера (определение попадания в воду), но не для физики твердого тела
        var col_shape = CollisionShape3D.new()
        var shape = BoxShape3D.new()
        shape.size = Vector3(60, 10, 160)
        col_shape.shape = shape
        water_area.add_child(col_shape)
        
        # Сигнал входа в воду (можно использовать для логики "дрон упал")
        # water_area.body_entered.connect(self._on_water_entered)

        return water_area

    # Логика проверки победы (вызывается из основного цикла игры)
    func check_win_condition(drone_position: Vector3) -> bool:
        var landing_pos = Vector3(0, 1.5, 120)
        if drone_position.distance_to(landing_pos) < 3.0:
            return true
        return false
