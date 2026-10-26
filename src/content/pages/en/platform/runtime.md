---
title: "Swarma Runtime"
description: "Swarma Runtime: the swarm on the machines of one owner. One OS user per agent, the keyholder, grants, the bridge, the session host, Swarma Keeper, Swarma Curator and other modules with their guarantees and limits."
order: 2
nav: true
status_rows: [runtime-launcher, runtime-network, runtime-keys, runtime-operator, runtime-grants, runtime-transport, runtime-admission, runtime-dispatcher, runtime-sessions, runtime-keeper, runtime-curator, runtime-mcp, runtime-logins, runtime-credentials, runtime-remote-workplace, runtime-results, runtime-board, runtime-model-routing, runtime-memory]
---

Swarma Runtime holds the swarm on the machines of one owner. It is built from small modules with named contracts, and the module diagram makes sense together with the physical boundary: who can read whose files, open which sockets and call which operations.

Source: chapter 02 "Swarma as a whole", section "Swarma Runtime: boundaries on one installation"

## One OS user per agent, and the network

A prompt injection acts with the agent's rights. So the rule "do not read the neighbouring home" must hold even when the model has decided to break it. The runtime gives each autonomous agent a separate OS user, and the kernel separates their files and processes. The producer and the reviewer get different UIDs, and the producer's process cannot read the reviewer's working directory even if it knows where it is.

The OS user on its own does not close the network. Kernel rules for the agent's account let a local agent reach only its proxy listener, with no direct exit and no fallback route. Cooperative profiles only route the environment through the proxy by launch settings; only the kernel enforces the route.

A station is the place of one agent on a machine: its own OS account, its own identity on the carrier, its own keys, home and root context. What a station guarantees is set by the execution isolation contract.

> **Limit.** The user boundary holds the scope of actions available to the agent under stated conditions. Outside it remain a captured root and kernel bugs, the token the environment receives for its work, and the quality of the work within the permitted rights.

Source: chapter 04 "One OS user per agent and the agent's network", section "Why an OS user"; chapter 04 "One OS user per agent and the agent's network", section "The machine chooses the network"; chapter 04 "One OS user per agent and the agent's network", section "The station and its guarantees"; chapter 04 "One OS user per agent and the agent's network", section "Limits of the boundary"

## Keys and the keyholder

An installation has one master secret. Where possible, hardware storage protects it. Agent keys are derived from it hierarchically, along a derivation path that encodes a stable identity. An OS user can disappear and reappear, while the persistent identity stays.

The keyholder listens on a Unix socket, and the kernel tells it the peer's UID. An agent does not choose its identity with a text field in the request: a reviewer's process can write the orchestrator's name in a request, but its connection still carries the reviewer's UID. The identity key does not sit in a file the agent can read, and the agent asks the keyholder for a signature.

> **Limit.** Some secrets are still visible to the agent. The model environment presents the provider token itself, so it can read the token in its own environment. The broker limits to whom and when such a token is issued, but it cannot make the token non-exportable.

Source: chapter 05 "Keys and the keyholder", section "Master secret and stable identity"; chapter 05 "Keys and the keyholder", section "The kernel establishes the peer"; chapter 02 "Swarma as a whole", section "Swarma Runtime: boundaries on one installation"

## Grants

A child capability is bounded by its parent's: a subset of actions and targets, a duration no longer, a depth within the permitted limits. Each record refers to its parent, and the check goes up to the root. If a child is asked for wider rights than the caller has, the dispatcher refuses before the launch.

Before every start the dispatcher asks the broker for a revocation check of the exact chain. There are three answers: not revoked, revoked or unavailable, and the answer "unavailable" means refusal.

> **Limit.** Revocation does not pull back a token that sits in the agent's process. Revocation stops new issuance, but it does not take back a secret that has been disclosed, so containment is wider than revoking a grant.

Source: chapter 06 "Grants and authority", section "Delegation only by attenuation"; chapter 06 "Grants and authority", section "Revocation and unknown state"

## The message path and the bridge

Input and output pass through the bridge. The carrier delivers messages, the bridge checks them and passes them to the session host, and the agent reads its mailbox. The right comes from the signature and the grant; the messenger only delivers. The agent has no messenger credentials and does not talk to the messenger directly.

Carrier admission removes the shared registration secret: an account goes to whoever the key of a registered machine vouched for. A shared token for all machines would open everything if it leaked from any one of them, and an account name proves nothing by itself.

Source: chapter 02 "Swarma as a whole", section "Swarma Runtime: boundaries on one installation"; chapter 07 "The message path and the bridge", section "The carrier does not become a source of authority"; chapter 08 "Carrier admission", section "Why admission is needed"

## Launch and the session host

Launch is split between components. The router chooses the model, Swarma Curator assembles the profile, home, instructions, skills and MCP, the dispatcher checks the right to launch and the space on the machine, and the user manager and launcher create the account and start the program under it. That is why a policy refusal, a resource shortage and an execution error can be told apart.

A long session is held by the session host and its runner. The session host service runs under its own account, and the runner runs under the agent's account. One dispatcher of the session host writes into the session's input, and the runner accepts commands only from the current controller epoch.

Source: chapter 09 "Agent launch and the session host", section "The nested launch"; chapter 09 "Agent launch and the session host", section "The service, the runner and the single writer"

## Swarma Keeper

A handover of responsibility has three stages: sent, accepted, started. The answer "I take it" confirms acceptance, not the start. Until the new holder's first action is verified and durably recorded, the duty stays with the previous holder. A missed deadline means the handover failed, and the obligation stays open.

> **Limit.** The keeper checks the allowed form of the evidence and its link to the handover, not the quality of the work done. Acceptance of the substance stays with the process that owns the work.

Source: chapter 10 "Swarma Keeper", section "A handover completes with an action"

## Swarma Curator

A skill is a package with `SKILL.md` and supporting material. The project declares skills in `Skillfile.json`, Swarma Curator installs them and pins the resolved versions in a lock file, so the set is reproduced at every launch. A profile combines the root context package, its skills and MCP declarations, and an overlay adds machine or operator changes.

> **Limit.** Installing a profile gives no system authority to launch as another user or to reach someone else's secrets. Those boundaries are held by the runtime's mechanisms.

Source: chapter 11 "Swarma Curator", section "Skill, profile and overlay"

## Credentials

The credential broker runs as a service under a separate account, with a Unix socket and no network listener. A subscription is set up with the broker once, and a launch gets a lease, that is, the right to the material within a permitted launch. The operator connects a subscription by a widening action, and the broker does not accept the connection from an agent session.

> **Limit.** Revocation forbids new issuance and renewals, but it does not erase a token that was handed over: that token stays valid until its expiry or until the provider itself revokes it.

Source: chapter 12 "Credentials and logins", section "The broker: one subscription, leases for launches"

## The remote workplace

By design, a workplace is a separate OS user on the project machine: its own home, its own firewall, its own resource group and the ceilings of that machine. The model runs on the donor's subscription. Tool calls and mail reach the project environment over one SSH connection that the donor opens. The project opens no reverse connections.

> **Limit.** This adds no computing resources to the environment: the throughput of the project machine remains the constraint.

Source: chapter 13 "The remote workplace", section "The model thinks at the donor, the hands are ours"

## The task board

The board holds tasks and the process they go through. Integration goes through compare-and-set: the target head is updated only if it matches the expected starting state. If the base has moved ahead, the base must be updated and the review repeated, and a verdict based on a similar diff does not carry over to the new candidate. A separate repository-actions service under its own account performs the advance.

> **Limit.** The reviewer receives the diff and blobs read-only, but this does not remove semantic prompt injection in the text being read: the reviewer still has to assess untrusted content.

Source: chapter 14 "The task board and the process", section "Why integration compares the exact head"

## The model router

The router does not call an LLM to choose: the same labels, candidates, data and policy give the same result. The task text cannot talk the selector into choosing a forbidden model, because the selector does not read it.

> **Limit.** Wrong labels or weak data remain weak input: determinism does not make them true.

Source: chapter 15 "Models and money", section "Why the choice is deterministic"

## Agent memory

Memory answers the question about evidence. It names the decision in force and its exact source, shows which decision it replaced, and says honestly where the check is incomplete.

> **Limit.** Memory does not establish what is true in the world, and it gives no authority. The right to an action is checked by the component that performs the action.

Source: chapter 16 "Agent memory", section "Purpose"

## The operator and interfaces

By design, the operator's companion app shows the exact action and signs it with a key in the phone's secure chip once the person has confirmed presence. Showing the exact content is required, for example, for issuing a grant and connecting a subscription. Such an action is not accepted from inside an agent session, and the signature of one action does not fit another.

> **Limit.** If the boundary of OS users is intact, an injection into an agent does not obtain the owner's signature. The user boundary does not protect against a compromise of the kernel or of the signing device itself.

Source: chapter 17 "The operator and interfaces", section "The operator's phone"

## Where we are

[[status]]

Source: chapter 30 "Where we are and what comes next", section "Layer map"
