---
title: "Book"
description: "The book about Swarma: what it describes, the map of five parts and reading routes."
order: 8
nav: true
---

[[publications book]]

The book "Swarma", subtitled "A platform for swarms of AI agents: from one machine to an open network". Authors: Алексей Григорьев, Иван Опарин. Version 1.6.1, October 2026.

Source: chapter 00 "Who this book is for"

## What the book describes

The book describes the architecture: what problem each mechanism solves, where a right is checked and on which assumption a promise rests. The module documentation describes installation and commands. The book is written for an engineer who understands distributed systems, has heard of blockchain and has worked with Claude Code, Codex or a similar agent environment. Every guarantee in it has its limits named.

The Russian version of the book is the source of truth. Where the book and the module specifications differ, the specifications are right.

Source: chapter 00 "Who this book is for"; chapter 00 "Who this book is for", section "The reader"

## Design and state

The book describes the platform in finished form, in the present tense: this is how the service is built by design. The development state of each part is collected in the chapter "Where we are and what comes next", which also holds the only list of open questions. On the site this chapter is represented by the page [Where we are](/en/status/).

Source: chapter 00 "Who this book is for", section "Design and readiness"

## Five parts

The book goes from cause to mechanism and then assembles the mechanisms into end-to-end scenarios.

| Part | Main question |
| --- | --- |
| Why and what | why the existing agent process is not enough |
| Swarma Runtime: a swarm on the machines of one owner | how to hold agents and their authority on your own machines |
| Swarma Protocol: many owners, one environment | how to admit someone else's capacity to a shared project |
| Swarma Chain: identity, reputation, economics | where a participant exists beyond one project |
| Together | how the parts connect and what exists today |

Source: chapter 00 "Who this book is for", section "Map of the five parts"

## Reading routes

The book can be read in order, or you can choose a route for your task.

- The owner of an installation should start with the first part, then read the chapters "One OS user per agent and the agent's network", "Grants and authority" and "The operator and interfaces", and then "End-to-end scenarios" and "Where we are and what comes next".
- A runtime engineer needs the whole path from the account to the session.
- An engineer of the distributed layer can go from the first part to the chapters "The protocol model" and "Journal, quorum and invariants", and then return to the local boundaries.
- Those interested in the chain need the chapter "Agent identity" first.

Source: chapter 00 "Who this book is for", section "Map of the five parts"
