.PHONY: help install dev test clean run migrate upgrade downgrade

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pip install -r requirements.txt

install-dev: ## Install development dependencies
	pip install -r requirements.txt
	pip install pytest pytest-asyncio httpx black isort flake8

run: ## Run the development server
	python app/run.py

run-prod: ## Run the production server
	uvicorn app.main:app --host 0.0.0.0 --port 8000

# Database migrations removed - using create_table.sql instead

test: ## Run tests
	pytest

test-cov: ## Run tests with coverage
	pytest --cov=app --cov-report=html

lint: ## Run linting
	flake8 app/
	black --check app/
	isort --check-only app/

format: ## Format code
	black app/
	isort app/

clean: ## Clean up temporary files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .pytest_cache/
	rm -rf htmlcov/

db-reset: ## Reset database (WARNING: This will delete all data)
	mysql -u local -p123456 local_db < create_table.sql

logs: ## Show application logs
	tail -f logs/app.log

shell: ## Open Python shell with app context
	python -c "from app.main import app; from app.db.database import get_db; print('App loaded successfully')"

create-admin: ## Create or update admin user
	python create_admin.py

list-admins: ## List all admin users
	python list_admins.py

setup: install create-admin ## Complete setup (install, create admin)
	@echo "Setup completed! Make sure to run create_table.sql first, then run 'make run' to start the server"
