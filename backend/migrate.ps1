Set-Location $PSScriptRoot
python -m alembic -c alembic/alembic.ini upgrade head
