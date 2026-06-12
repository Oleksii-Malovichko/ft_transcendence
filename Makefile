
# Read .env too, so make knows its values (e.g. HTTPS_PORT for the URL).
# On a fresh clone .env doesn't exist yet: the `.env` rule below creates it.
-include .env
HTTPS_PORT ?= 8443

COMPOSE     := docker compose
COMPOSE_DEV := $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml

.PHONY: all up down logs ps clean re db

all: up

# --wait: return only when every service is running and healthy.
up: .env
	$(COMPOSE) up --build --detach --wait
	@echo "Ready: https://localhost:$(HTTPS_PORT)  (accept the self-signed certificate once)"

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs --follow

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down --volumes --rmi local

re: clean up

db: .env
	$(COMPOSE_DEV) up --detach --wait db

# First run: create .env from the documented example (then review it).
.env:
	cp .env.example .env
	@echo "Created .env from .env.example: review the values, especially passwords."