# Nibby's web scraper

Since the default mail notification service from kv.ee is so godawfully slow, I wrote this app that scrapes the page every 10 minutes and sends you emails instead.

Supports kv.ee and okidoki.ee

## How it works

Loads a pre-defined search url up in a headless chromium instance. If it finds a new apartment listing, it takes a picture of it and sends it as an email to you.

## Run it

1. Copy `config/config.example.json` to `config/config.json`

2. Add your email info (both the sender and receiver) and pages to scrape

3. Run the app

```
npm install
npm start
```
