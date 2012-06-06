doc:
	groc "*.js" "README.md" --github false

.PHONY: doc

test:
	mocha \
		--reporter landing \
		--ui bdd \
		--require chai \
		--require ./cogs \
		--growl

.PHONY: test
