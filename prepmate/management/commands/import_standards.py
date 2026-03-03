import csv
from django.core.management.base import BaseCommand
from prepmate.models import Standard


class Command(BaseCommand):
    help = "Import Common Core standards from CSV"

    # Change filepath based on the file being imported (ccss_math or ccss_ela)
    def handle(self, *args, **kwargs):
        file_path = "prepmate/data/ccss_math.csv"

        with open(file_path, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            # Change row number based on need (192 is end of grade 5 math)
            # Opportunity to import ALL rows for up to grade 12
            for i, row in enumerate(reader):
                if i >= 192:
                    break

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
        self.stdout.write(self.style.SUCCESS("Standards imported successfully."))
