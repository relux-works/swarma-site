---
title: "Swarma Protocol"
description: "Swarma Protocol: joint work of independent owners over one execution environment. Three planes, a journal with a quorum, the task contract, the orchestrator's lease, independent review and the limits of the promise."
order: 3
nav: true
status_rows: [protocol-environment, protocol-journal, protocol-task, protocol-lease, protocol-integration, protocol-effects, protocol-federation]
---

The execution environment is the place where the project's working tree lives, commands and checks run, artifacts are built and the main branch advances. The agent loop, that is, a model with its context and tool calls, runs at the contributor, who gives the capacity of their model. The environment does not run these loops: it passively executes permitted commands that come from outside. In this way computing the next action and the action itself end up on different sides of the trust boundary.

This separation is needed where the environment is expensive to move to each participant: a project may depend on Xcode, licences, devices, GPUs, signing keys or data that may not leave. The contributor's credentials stay with the contributor.

Source: chapter 18 "The protocol model", section "One environment, several owners"

## Three planes

Swarma Protocol separates thinking, governance and execution. Thinking is done by the contributors' agent loops with their models and credentials. Governance is done by core nodes, which keep the journal of capabilities and acceptance. Execution is done by the project's authoritative environment, which holds the main branch, the task scopes and the checks.

A model can propose a useful fix, but a proposal is not a capability. Core nodes can confirm that an assignment is admissible, but their signatures are not an execution result. The environment can run a command successfully, but successful execution does not mean the resulting code is accepted. The protocol links the three facts with records and hashes and keeps them distinct.

[[figure protocol-topology]]

Source: chapter 18 "The protocol model", section "Three planes of work"; chapter 02 "Swarma as a whole", section "Swarma Protocol: joint work of independent owners"

## What crosses the network

Commands, their output, hashes and signatures pass between participants, and the control exchange carries assignments, information about revisions, verdicts and messages about continuing work. The development environment as a whole does not move over the network. The model receives tool output and can read the code available to it, but it has no project keys.

Each node declares its administrative domain, model family and toolchain, so that the project can tell independent checks from repeats with the same sources of error. A field in the declaration does not prove its own truth, and two nodes of one owner with one model family do not give independence.

Source: chapter 18 "The protocol model", section "What crosses the network"

## The journal and trust levels

The journal is an ordered chain of signed records. A record contains the hash of the previous record, a type, a body or hashes of bodies, and signatures, so history is only appended to. A record is committed when it has a quorum certificate, that is, a set of signatures over one content that is sufficient for the level. Until then a proposed record does not authorise the environment.

The levels L0, L1 and L2 differ in the rules of the quorum certificate and the assumptions about the adversary, while the invariants of authorisation and acceptance hold at every level. At L0, one core node puts one signature. At L1, a majority threshold prevents a single compromised key from authorising a record alone, and the uniqueness of history rests on the honesty of the sequencer. At L2, Byzantine fault-tolerant consensus also protects against a split history, as long as the malicious core nodes do not exceed the tolerated number. The project chooses the level.

Source: chapter 19 "Journal, quorum and invariants", section "A record and its commitment"; chapter 19 "Journal, quorum and invariants", section "Three trust levels"; chapter 02 "Swarma as a whole", section "Swarma Protocol: joint work of independent owners"

## The task contract

The plan permits, the contract requires. The plan digest fixes tool bindings, grants and limits, and the environment checks it on every call. The contract digest fixes the conditions of the result and of acceptance. An agent can stay within the permitted paths and still produce a wrong result, so matching one does not replace checking the other.

Every check has one of three outcomes: "passed", "failed", "not established". A timeout or a tool failure gives "not established", and acceptance needs a positive outcome of the required check.

Source: chapter 20 "The task contract and validator rules", section "The plan permits, the contract requires"; chapter 20 "The task contract and validator rules", section "The property profile and three outcomes"

## The orchestrator's lease

The orchestrator plans the work, and a core node holds this role under a lease. The lease carries an epoch and a fencing token, and every record of the orchestrator carries them too. If the orchestrator's machine falls asleep, the lease expires and the next core node takes the role with a new epoch and token. Validators do not sign an assignment that the previous orchestrator sends after waking up: the authenticity of the sender and the currency of its capabilities are checked as separate conditions.

Source: chapter 21 "The leased orchestrator and the task cycle", section "Lease, epoch and fencing token"; chapter 02 "Swarma as a whole", section "Swarma Protocol: joint work of independent owners"

## Candidate, review and head advance

A change goes through five steps. The producer works within the scope of its task. The environment builds an immutable candidate. The orchestrator initiates review, and an independent reviewer checks the candidate. The check runner reports results for the same candidate. Finally, the validators check that integration is admissible.

The set of eligible reviewers is frozen before the candidate's hash appears, so the orchestrator cannot pick a convenient reviewer once the candidate is known. On receiving a quorum certificate, the repository-actions executor atomically replaces the head of the main branch, only if it still equals the expected one. If another task got ahead, the candidate is rebuilt on the new head, and review and checks are repeated.

Source: chapter 02 "Swarma as a whole", section "Swarma Protocol: joint work of independent owners"; chapter 21 "The leased orchestrator and the task cycle", section "Who checks the candidate"; chapter 21 "The leased orchestrator and the task cycle", section "Atomic head advance"

## Stop and federation

Any core node can issue an emergency stop certificate with the signature of one key. On receiving it, the environment switches to a safe mode at once: it opens no new sandboxes, starts no runner operations and does not advance the head. Resuming requires a quorum certificate of the current trust level. One honest participant must be able to stop suspicious work, and one participant must not be able to resume it against the others.

A federation joins several projects, among which the contributor chooses the recipient of their capacity. The projects' environments stay separate, and each project publishes a signed manifest so that a participant can assess the conditions of joining.

Source: chapter 23 "External effects, stop and federation", section "Stop with one signature"; chapter 23 "External effects, stop and federation", section "Federation of projects"

## Limits of the promise

> **Limit.** The protocol does not guarantee the correctness of a model's judgement, prevention of a compromise of the environment, confidentiality of code from contributors and providers, protection against an escape through a kernel vulnerability, complete observation of an untrusted node outside the protocol, a single history at L1 with a malicious sequencer, liveness with a malicious majority, or fairness of the economics. A confirmed identity certifies control, not behaviour.

Enumeration of a bounded model is exhaustive only within its given bounds: it does not extend to an arbitrary number of tasks, contract versions, epochs or deliveries. The environment and validators in such a model are honest, and it does not represent code content, model judgement, the full-scale lease, stopping or external effects. Carrying the result beyond these limits requires a separate argument.

Source: chapter 24 "Threat model", section "Explicit limits of the promise"; chapter 22 "What has been checked and how to check the rest", section "Where the established result ends"

## Where we are

[[status]]

Source: chapter 30 "Where we are and what comes next", section "Layer map"
