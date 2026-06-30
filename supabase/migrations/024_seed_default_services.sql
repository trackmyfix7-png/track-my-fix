-- Insere serviços padrão de mecânica para todas as oficinas existentes.
-- Serviços criados com base_price = 0 e is_active = false.
-- O admin deve editar cada um, definir um preço e ativar manualmente.

INSERT INTO services (
  workshop_id,
  name,
  category,
  description,
  estimated_time,
  base_price,
  is_active,
  visible_to_client
)
SELECT
  w.id,
  s.name,
  s.category,
  s.description,
  s.estimated_time,
  0.00,
  false,
  false
FROM workshops w
CROSS JOIN (
  VALUES
    -- Manutenção
    ('Troca de óleo e filtro',          'Manutenção',         'Substituição do óleo do motor e filtro de óleo',                           '1h 30min'),
    ('Troca de filtro de ar',            'Manutenção',         'Substituição do filtro de ar do motor',                                    '30min'),
    ('Troca de filtro de combustível',   'Manutenção',         'Substituição do filtro de combustível',                                    '1h'),
    ('Troca de líquido de arrefecimento','Arrefecimento',      'Substituição do fluido de arrefecimento e limpeza do radiador',            '1h'),
    -- Freios
    ('Troca de pastilhas de freio',      'Freios',             'Substituição das pastilhas de freio dianteiras ou traseiras',              '1h 30min'),
    ('Troca de disco de freio',          'Freios',             'Substituição dos discos de freio dianteiros ou traseiros',                 '2h'),
    ('Sangria de freios',                'Freios',             'Troca do fluido de freio e eliminação de ar do sistema',                  '1h'),
    -- Motor
    ('Troca de correia dentada',         'Motor',              'Substituição da correia de distribuição com tensor e rolamentos',          '4h'),
    ('Troca de velas de ignição',        'Motor',              'Substituição das velas de ignição',                                       '1h'),
    ('Troca de correia do alternador',   'Motor',              'Substituição da correia de acessórios (alternador e ar-condicionado)',     '1h'),
    -- Suspensão
    ('Alinhamento',                      'Pneus e Suspensão',  'Ajuste dos ângulos das rodas conforme especificação do fabricante',       '1h'),
    ('Balanceamento',                    'Pneus e Suspensão',  'Equalização do peso das rodas para eliminar vibrações',                   '1h'),
    ('Troca de amortecedor',             'Pneus e Suspensão',  'Substituição dos amortecedores dianteiros ou traseiros',                  '2h'),
    ('Troca de pivô e terminal',         'Pneus e Suspensão',  'Substituição de pivô de suspensão e terminal de direção',                 '2h'),
    -- Elétrica
    ('Diagnóstico eletrônico',           'Elétrica',           'Leitura de falhas e diagnóstico com scanner automotivo',                  '1h'),
    ('Troca de bateria',                 'Elétrica',           'Substituição da bateria do veículo com teste do alternador',              '30min'),
    ('Revisão elétrica geral',           'Elétrica',           'Verificação de alternador, motor de partida, fusíveis e fiação',         '2h'),
    -- Ar-condicionado
    ('Recarga de ar-condicionado',       'Ar-condicionado',    'Recarga do gás refrigerante e verificação de pressão do sistema',        '1h 30min'),
    ('Higienização de ar-condicionado',  'Ar-condicionado',    'Limpeza e desinfecção do evaporador e sistema de ventilação',            '2h'),
    -- Direção
    ('Troca de fluido de direção',       'Direção',            'Substituição do fluido da direção hidráulica',                           '1h'),
    -- Revisão geral
    ('Revisão completa 10.000 km',       'Revisão',            'Revisão de motor, freios, suspensão, elétrica e fluidos — 10 mil km',    '3h'),
    ('Revisão completa 20.000 km',       'Revisão',            'Revisão ampliada com troca de filtros e fluidos — 20 mil km',            '4h')
) AS s(name, category, description, estimated_time)
-- Não duplica se o serviço com o mesmo nome já existir para essa oficina
WHERE NOT EXISTS (
  SELECT 1
  FROM   services sv
  WHERE  sv.workshop_id = w.id
  AND    sv.name        = s.name
);
