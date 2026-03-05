import csv
import os
from django.conf import settings
from prepmate.models import Standard


csv_files = {
       "math": "ccss_math.csv",
       "ela": "ccss_ela.csv"
}

for subject, filename in csv_files.items():
    file_path = os.path.join(settings.BASE_DIR, 'prepmate', 'data', filename)

    with open(file_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:

            # Create new standard object for each row
                Standard.objects.get_or_create(
                    code=row["id"].strip(),
                    defaults={
                        "content_type": row["content_type"].strip(),
                        "category_id": row["category_id"].strip(),
                        "category_name": row["category_name"].strip(),
                        "grade_id": row["grade_id"].strip(),
                        "grade_name": row["grade_name"].strip(),
                        "item": row["item"].strip(),
                        "description": row["description"].strip()
                    }
            )
