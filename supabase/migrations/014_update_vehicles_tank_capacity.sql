-- Aktualizácia/pridanie vozidiel s objemom nádrže

-- 1. ŠKODA Octavia Combi Ambition
INSERT INTO vehicles (name, license_plate, vin, brand, model, fuel_type, tank_capacity, initial_odometer)
VALUES ('ŠKODA Octavia Combi Ambition', 'ZA721KA', 'TMBJJ7NX1NY087979', 'Škoda', 'Octavia Combi', 'nafta', 50, 0)
ON CONFLICT (license_plate) DO UPDATE SET
  tank_capacity = 50,
  vin = EXCLUDED.vin;

-- 2. ŠKODA Fábia
INSERT INTO vehicles (name, license_plate, vin, brand, model, fuel_type, tank_capacity, initial_odometer)
VALUES ('ŠKODA Fábia', 'ZA256ES', 'TMBJH25J6B3175025', 'Škoda', 'Fabia', 'benzin', 45, 0)
ON CONFLICT (license_plate) DO UPDATE SET
  tank_capacity = 45,
  vin = EXCLUDED.vin;

-- 3. BMW X3 xDrive 30d
INSERT INTO vehicles (name, license_plate, vin, brand, model, fuel_type, tank_capacity, initial_odometer)
VALUES ('BMW X3 xDrive 30d', 'ZA248JM', 'WBATX750X0N053685', 'BMW', 'X3 xDrive 30d', 'nafta', 68, 0)
ON CONFLICT (license_plate) DO UPDATE SET
  tank_capacity = 68,
  vin = EXCLUDED.vin;

-- 4. KIA CEED SW 1,6 CRDI MHEV
INSERT INTO vehicles (name, license_plate, vin, brand, model, fuel_type, tank_capacity, initial_odometer)
VALUES ('KIA CEED SW 1,6 CRDI MHEV', 'AA867DH', 'U5YH5819APL162229', 'Kia', 'Ceed SW', 'nafta', 50, 0)
ON CONFLICT (license_plate) DO UPDATE SET
  tank_capacity = 50,
  vin = EXCLUDED.vin;

-- 5. RANGE ROVER SPORT 4.4 V8
INSERT INTO vehicles (name, license_plate, vin, brand, model, fuel_type, tank_capacity, initial_odometer)
VALUES ('RANGE ROVER SPORT 4.4 V8', 'ANTHILL', 'SAL1A2B90SA459396', 'Land Rover', 'Range Rover Sport', 'benzin', 90, 0)
ON CONFLICT (license_plate) DO UPDATE SET
  tank_capacity = 90,
  vin = EXCLUDED.vin;

-- 6. BMW X3 M50i xDrive
INSERT INTO vehicles (name, license_plate, vin, brand, model, fuel_type, tank_capacity, initial_odometer)
VALUES ('BMW X3 M50i xDrive', 'AA475SO', 'WBA71GP0609Y81113', 'BMW', 'X3 M50i', 'benzin', 65, 0)
ON CONFLICT (license_plate) DO UPDATE SET
  tank_capacity = 65,
  vin = EXCLUDED.vin;

-- 7. MERCEDES-BENZ GLC 300 e 4MATIC
INSERT INTO vehicles (name, license_plate, vin, brand, model, fuel_type, tank_capacity, initial_odometer)
VALUES ('MERCEDES-BENZ GLC 300 e 4MATIC', 'AA792OD', 'W1NKM5GB4RF142355', 'Mercedes-Benz', 'GLC 300 e', 'hybrid', 50, 0)
ON CONFLICT (license_plate) DO UPDATE SET
  tank_capacity = 50,
  vin = EXCLUDED.vin;
