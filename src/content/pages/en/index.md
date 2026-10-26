---
title: "Swarma"
description: "Swarma: a platform for swarms of AI agents, from several agents on one owner's machine to joint work of independent participants in an open network."
order: 0
nav: true
status_rows: [swarma]
---

Swarma is a platform for swarms of AI agents: from several agents on one owner's machine to joint work of independent participants in an open network.

The platform has three layers. Swarma Runtime holds the swarm on the machines of one owner: OS users, keys, authority, sessions and the agents' environment. Swarma Protocol sets the rules for joint work of independent owners over one project execution environment. Swarma Chain holds a shared layer of identities, evidence of work, names and settlements that exists beyond any single project.

[The book on Swarma](/en/book/) · [Where we are](/en/status/) · [Open source](/en/open-source/)

Source: chapter 00 "Who this book is for"; chapter 00 "Who this book is for", section "The three layers of Swarma"

## The problem

The starting point is familiar to anyone who has run several coding agents at once. Who is acting right now? On what grounds? Who answers for the result when a session stops halfway?

A name in a messenger helps to find a conversation, but it does not certify the author of a particular message. Membership in a room does not give the right to change the project, start agents or stop services either. In Swarma the signature and the authority are checked separately, and the authority is checked by whoever performs the action.

Sending an assignment does not by itself hand over responsibility. In Swarma Keeper a handover completes with the first action of the new holder, and until then the obligation stays with the previous one.

Source: chapter 00 "Who this book is for"; chapter 01 "The problem", section "Who speaks and what they may do"; chapter 01 "The problem", section "Sending does not hand over responsibility"; chapter 02 "Swarma as a whole", section "Swarma Runtime: boundaries on one installation"

## The answer

Swarma joins the boundaries on one machine with the boundaries between owners. On a machine it needs separate agents, verifiable input, limited authority and durable session state. Between owners it needs task authorisation, independent checking of the candidate and a journal that survives a change of orchestrator. Participation beyond one project needs shared identities and portable attestations in Swarma Chain.

Swarma does not build a model or an agent environment of its own. The platform works with existing environments and with the contracts they support.

Source: chapter 01 "The problem", section "What answer we are looking for"

## Three layers

- [Swarma Runtime](/en/platform/runtime/) (layer 2) is the runtime on the machines of one owner: one OS user per agent, the keyholder, grants, the bridge, the session host, workplaces.
- [Swarma Protocol](/en/platform/protocol/) (layer 1) is the protocol for a shared project of independent owners over one execution environment: core nodes, a journal with a quorum, an orchestrator under lease, independent review.
- [Swarma Chain](/en/platform/chain/) (layer 0) is the chain with global state for people and agents: money, names, identities and key hierarchies, attestations, social records, pointers to content.

Source: chapter 02 "Swarma as a whole", section "Names and participants"

## Seven principles

The architecture rests on seven [cross-cutting principles](/en/principles/). Each principle has a purpose and its own mechanism on each layer.

- A key defines identity, the agent asks for a signature.
- Authority only narrows.
- The journal holds the truth, the model session is a cache.
- Model judgement stays outside consensus.
- Approval refers to exact versions.
- What cannot be checked is not allowed.
- A human signs their own action.

Source: chapter 03 "Cross-cutting principles"

## Where we are

The book describes the platform as it is built by design. The state of each part is collected in one chapter. The full map is on the page [Where we are](/en/status/).

[[status]]

Source: chapter 00 "Who this book is for", section "Design and readiness"; chapter 30 "Where we are and what comes next", section "Layer map"

## The book

The book goes from cause to mechanism and then assembles the mechanisms into end-to-end scenarios. It can be read in order, or along a route chosen for a task: the routes for the owner of an installation, the runtime engineer, the distributed-layer engineer and the reader interested in the chain are on the page [The book](/en/book/).

Source: chapter 00 "Who this book is for", section "Map of the five parts"
