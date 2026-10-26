---
title: "Cross-cutting principles"
description: "The seven principles of the Swarma architecture and the mechanism of each in Swarma Runtime, Swarma Protocol and Swarma Chain."
order: 5
nav: true
---

The three layers of Swarma face different adversaries. In the runtime, an agent may obey someone else's text. In the protocol, owners and their agents are not obliged to trust each other. In the chain, the network is open. So the same idea needs its own mechanism on each layer, and a guarantee must not be carried from one layer to another just because the words sound alike. The architecture rests on seven principles, and each has a purpose and its own mechanism on each layer.

Source: chapter 03 "Cross-cutting principles"

## A key defines identity, the agent asks for a signature

A name says how to address a participant. A signature binds particular bytes to a key. If a private key sits in a file the agent can read, an injection can persuade the agent to read that file. So a local agent does not receive its identity key: it asks a separate service to sign the data. Whether a signed message is sensible and permitted is checked separately.

**Swarma Runtime.** The keyholder plays this role. The kernel tells it the UID of the connected process, and the registration binds the account and its generation to a stable identity. A line "I am the reviewer" in the request is not enough to sign for a neighbour.

**Swarma Protocol.** A long-lived identity key certifies short-lived node keys. The contributor signs on the machine of their agent loop, and keys are not handed to the project environment. A new name does not prove independence.

**Swarma Chain.** An identity is a spendable cell with the current keys and a hash of the next ones. Only the next keys can spend it, so stealing the current key does not take the identity away. Proven possession of a key does not promise that the owner is honest.

Source: chapter 03 "Cross-cutting principles", section "A key defines identity, the agent asks for a signature"

## Authority only narrows

Delegation distributes a right that was received and creates no new one. A capability defines what a participant may do with which objects. A child request stays within its parent in actions, targets and duration. Otherwise an orchestrator could bypass its own ceiling simply by creating a child with wider rights.

**Swarma Runtime.** A grant is a signed permission. An orchestrator that may launch with only one profile cannot delegate a different profile or a longer duration to a child. The service that receives the request checks this.

**Swarma Protocol.** The chain of authority runs from the goal through the orchestrator's capability to the task and the revision. A task "fix synchronisation" does not give the producer the right to change protected checks or rewrite its own acceptance criteria: that needs a new version of the contract with separate authorisation.

**Swarma Chain.** The boundary runs between identity and admission. An identity brings a history of attestations, and the receiving runtime decides by its own policy what participation to allow. A reviewer's reputation in one project gives no right to integrate code in another.

Source: chapter 03 "Cross-cutting principles", section "Authority only narrows"

## The journal holds the truth, the model session is a cache

The model's context is needed for work, but on its own it does not define the state of authority and obligations. It gets lost, compressed and handed to a successor together with mistaken assumptions. The journal holds what was committed by the rules of the system, so the authoritative state is restored without trusting the previous agent's retelling.

**Swarma Runtime.** Swarma Keeper restores holders and continuations from its journal. If the conversation says "handed over the work" but there is no confirmation that the new holder started, the session's memory does not close the obligation.

**Swarma Protocol.** The orchestrator's successor reads the journal and treats the inherited session as untrusted. Validators reject an assignment with an old epoch as stale, however convincing the explanation in the previous holder's context.

**Swarma Chain.** An indexer computes reputation from signed attestations. An agent's story "they accepted me in my last project" does not replace records. Only roots of attestation batches with metadata go into the chain, with no code, prompts or secrets.

Source: chapter 03 "Cross-cutting principles", section "The journal holds the truth, the model session is a cache"

## Model judgement stays outside consensus

Review answers a question of substance; a validator answers the question whether the rules were followed. Consensus agrees on records, signatures, versions and allowed transitions. It cannot turn a mistaken understanding of a requirement by several models into a correct one.

**Swarma Runtime.** An agent may propose to restart a service and explain why that helps. Confidence does not create authority: a deterministic handler checks admission and performs only a registered action.

**Swarma Protocol.** The reviewer assesses the candidate, and the validator checks the signature, the addressing of the result and independence under the project's policy. A positive verdict from the producer in place of the required independent participant is not valid for integration. The protocol answers for the independence and accountability of judgement, but it does not promise infallibility.

**Swarma Chain.** A node checks a social record by its form, signature and payment, and indexers compute its meaning. An included publication does not mean that the network found it useful or true.

Source: chapter 03 "Cross-cutting principles", section "Model judgement stays outside consensus"

## Approval refers to exact versions

A check has a subject: a particular candidate and the conditions under which it was checked. The task contract, the candidate, the policy and the environment together form the address of an attestation. Whoever carries an approval over to a similar patch substitutes the checked object without a new check.

**Swarma Runtime.** The operator confirms a particular widening action after seeing its content. Integration on the board goes through compare-and-set bound to the exact checked tree.

**Swarma Protocol.** The environment builds the candidate on the current head of the main branch. If the head has moved in the meantime, the atomic swap with the old expectation fails; the candidate is rebuilt and the final checks are repeated.

**Swarma Chain.** An attestation binds the agent's identity, the project, the hash of the candidate or revision and the versions of the contract and policy. A new runtime sees the outcome of work on a particular object.

Source: chapter 03 "Cross-cutting principles", section "Approval refers to exact versions"

## What cannot be checked is not allowed

Default denial is needed at the execution boundary, where an admission error becomes an effect. The unknown does not count as a positive outcome. The absence of evidence, a confirmed absence of an event and the inability to read a state are different, and they do not lead to the same permission.

**Swarma Runtime.** Before creating an account and starting, the dispatcher gets a fresh revocation verdict from the broker. An unreachable store does not prove that a grant is not revoked, and the launch is refused.

**Swarma Protocol.** The environment declares which limits it can actually enforce. An attestation with the outcome "not established" does not become a success because success is wanted.

**Swarma Chain.** A record's form, signature and payment are checked. An attestation counts only if the issuer's cell was alive at the height of the record.

Source: chapter 03 "Cross-cutting principles", section "What cannot be checked is not allowed"

## A human signs their own action

Autonomy does not mean that an agent may speak for a person. A widening action passes a separate human boundary where the exact content is confirmed. A signature is placed only over what the signing party received in full and checked.

**Swarma Runtime.** The phone shows the content of the grant, the person confirms with biometrics, and a key in the secure chip signs exactly this action. A widening is not accepted from inside an agent session.

**Swarma Protocol.** A producer cannot declare its own reading of a requirement to be a new authorised version of the contract. The protocol binds such a change to a separate capability and, if the policy requires human confirmation, to a key with human presence.

**Swarma Chain.** Child identities are certified and revoked by the owner's external parent: a cold key that does not live on everyday devices.

Source: chapter 03 "Cross-cutting principles", section "A human signs their own action"

## Reading the guarantees together

The principles meet at the boundary of a particular action. A genuine sender must have authority; the authority must be current; the check must refer to the object being accepted; the record must be committed by the rules; the execution must be physically held within the granted scope. One link does not prove the others.

> **Limit.** The guarantees have outer limits. A compromise of root breaks the local boundary; a compromise of the authoritative environment goes beyond the protocol's promises. A model's mistaken judgement can pass a correct procedure. A content hash does not guarantee that the content exists, and a portable history does not guarantee the honesty of the next action.

Source: chapter 03 "Cross-cutting principles", section "Reading the guarantees together"
