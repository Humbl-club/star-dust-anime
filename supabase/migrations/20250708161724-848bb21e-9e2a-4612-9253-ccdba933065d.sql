-- Add more legendary characters with rich descriptions
INSERT INTO username_pool (name, tier, source_anime, character_type, character_description, character_personality) VALUES
('Saitama', 'LEGENDARY', 'One Punch Man', 'main', 'A hero who can defeat any enemy with a single punch, seeking a worthy opponent', 'Bored, overpowered, secretly compassionate'),
('Light', 'LEGENDARY', 'Death Note', 'main', 'A brilliant student who gains the power of a Death God notebook', 'Genius, manipulative, god complex'),
('Edward', 'LEGENDARY', 'Fullmetal Alchemist', 'main', 'A young alchemist searching for the Philosophers Stone to restore his body', 'Determined, short-tempered, protective'),
('Lelouch', 'LEGENDARY', 'Code Geass', 'main', 'A exiled prince with the power of Geass, leading a rebellion', 'Strategic genius, charismatic, ruthless'),
('Senku', 'EPIC', 'Dr. Stone', 'main', 'A scientific genius rebuilding civilization from the stone age', 'Logical, enthusiastic about science, confident'),
('Tanjiro', 'EPIC', 'Demon Slayer', 'main', 'A demon slayer with incredible empathy, even for his enemies', 'Kind-hearted, determined, compassionate'),
('Midoriya', 'EPIC', 'My Hero Academia', 'main', 'A quirkless boy who inherits the power of the worlds greatest hero', 'Heroic, analytical, never gives up'),
('Mob', 'EPIC', 'Mob Psycho 100', 'main', 'A psychic middle schooler trying to live a normal life', 'Emotionally suppressed, powerful, seeks normalcy')
ON CONFLICT (name) DO UPDATE SET 
character_description = EXCLUDED.character_description,
character_personality = EXCLUDED.character_personality;