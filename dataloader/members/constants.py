package_level_sql = """
    CASE 
        WHEN package LIKE '%Mistr%' THEN 3
        WHEN package LIKE '%Tovaryš%' THEN 2
        WHEN package LIKE '%Učedník%' THEN 1
        WHEN 'Předplatné skříňky' THEN -1
        ELSE 0
    END
"""