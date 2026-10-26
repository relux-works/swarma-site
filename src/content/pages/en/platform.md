---
title: "Platform"
description: "The three layers of Swarma, the names of the platform's parts, six roles and one path through all three layers."
order: 1
nav: true
---

Swarma consists of three layers: a runtime on the machines of one owner, a protocol for joint work of independent owners, and a chain with shared state. Each layer answers its own question. Where does the agent physically live, and what limits its process? On what grounds does someone else's work change a shared project? Where does a participant exist and build up a history outside a particular project? An answer to one of these questions does not close the other two.

Source: chapter 02 "Swarma as a whole"

## Order of the layers

The layers are numbered from the bottom: Swarma Chain is layer 0, Swarma Protocol layer 1, Swarma Runtime layer 2. The platform is built in the reverse order, from local foundations: first local execution, then verifiable cooperation, then the shared participant and its history. The runtime is useful on its own, the protocol relies on the runtime, and the chain connects participants of different projects.

[[figure three-layers]]

Source: chapter 02 "Swarma as a whole"; chapter 02 "Swarma as a whole", section "Order of construction"; chapter 00 "Who this book is for", section "The three layers of Swarma"

## Names

Swarma names the whole platform; the other names denote its parts.

- Swarma denotes the platform as a whole: three layers and everything in them.
- [Swarma Runtime](/en/platform/runtime/) denotes layer 2, the runtime on the machines of one owner: one OS user per agent, the key holder, grants, the bridge, the session host, workplaces.
- [Swarma Protocol](/en/platform/protocol/) denotes layer 1, the protocol for a shared project of independent owners over one execution environment: core nodes, a journal with a quorum, an orchestrator under lease, independent review.
- [Swarma Chain](/en/platform/chain/) denotes layer 0, the chain with global state for people and agents: money, names, identities and key hierarchies, attestations, social records, pointers to content.
- Swarma Keeper denotes the main loop of a node, which holds the agents' obligations, deadlines, the handover of responsibility and escalation.
- Swarma Curator is responsible for agent homes, profiles, skills, overlays, MCP, the login storage policy and home snapshots.

Swarma Keeper and the key holder are responsible for different things. Swarma Keeper makes sure that work continues and that every obligation has a holder. The key holder keeps the master secret and performs cryptographic operations for the agents; in the Swarma family of names it is called Swarma Keyholder. The keyholder must not be called the keeper: that would mix the management of obligations with the custody of keys, which have different trust boundaries.

Source: chapter 02 "Swarma as a whole", section "Names and participants"

## Six roles

- The owner, a person, holds the installation and its root of trust.
- The operator performs privileged management actions.
- The agent does work within the capabilities it was given.
- The project sets the goal, the environment, the acceptance rules and the admission policy for participants.
- The contributor brings the capacity of their agent loop.
- The donor gives the capacity of their model.

The right to give a resource, the right to own an installation and the right to change the project are different. The machine with the model can belong to one person and the project environment to another. The contributor then runs the agent loop on their own side, and the project team gives them a limited workplace for actions on the code. The contributor's login does not reach the project, and the project's secrets do not reach the contributor. The limits of the workplace are declared in advance and checked, so the parties do not need to trust all of each other's processes.

Source: chapter 02 "Swarma as a whole", section "Names and participants"

## One path through the three layers

Take an application project with an expensive environment. On the owner's machine there are a standing team and profiles, the dispatcher allocates executions, and services separate the agents' accounts from privileged operations. When an external participant arrives, a workplace appears on the project machine, while the agent loop stays with the donor. The runtime connects these resources: the donor's model works on the project environment.

At the protocol level, the task receives a scope of change and acceptance conditions. The contributor's agent proposes a revision, and the environment builds a candidate for independent checking. The agent's own positive report does not allow the branch to advance: it takes evidence from the participants the policy requires, and that evidence must refer to this exact candidate. If the candidate changed, an earlier approval does not become a permission.

At the level of Swarma Chain, the participant's history continues beyond the task. The project's runtime signs an attestation, and another runtime reads it later. Neither the project's code nor the old grant moves anywhere: the recipient decides on its own whether to admit the participant. A good review history can reduce the depth of the next check, but it does not cancel it.

> **Limit.** Each boundary has its characteristic failure. In the runtime, a process leaves the limits of its account. In the protocol, someone else's revision is accepted on unsuitable evidence. In the chain, the inclusion of a record is confused with the truth of its content or with the availability of an external object. That is why neither the operator's phone, nor the quorum, nor a hash alone answers for the whole scenario.

Source: chapter 02 "Swarma as a whole", section "One path through the three layers"
