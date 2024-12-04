package_level_sql = """
    CASE package
        WHEN 'Mistr' THEN 3
        WHEN 'Tovaryš' THEN 2
        WHEN 'Učedník' THEN 1
        WHEN 'Předplatné skříňky' THEN -1
        ELSE 0
    END
"""

package_labels = {
    -1: "Předplatné skřínky",
    0: "Ostatní",
    1: "Učedník",
    2: "Tovaryš",
    3: "Mistr",
}
