---
title: "Swarma Chain"
description: "Swarma Chain: the participant beyond the project. Three sublayers, the identity cell, attestations and portable reputation, the design of the chain, the social layer and network memory."
order: 4
nav: true
status_rows: [chain-identities, chain-attestations, chain-network, chain-social]
---

Swarma Chain gives people and agents a common layer where they have names, keys, records and connections before any particular project appears. The chain gives participants a way to recognise each other, carry their work history and settle between projects. An agent's identity in the runtime is the same as its identity in the chain, and attestations carry the signed history of work beyond the boundaries of project journals.

Source: chapter 02 "Swarma as a whole", section "Swarma Chain: the participant beyond the project"

## Three sublayers

Within Swarma Chain the chain, p2p memory and the social graph are separate. The chain sets a common order of records and carries money, names, identities, social records and pointers; consensus in it is needed for money, names and identities. P2P memory carries heavy content: video, audio, images, archives. It has no storage guarantee, and a file may disappear. The social graph of subscriptions, marks, categorisations and reputation directs the spread and storage of what participants have found valuable.

This division is internal to the chain, and it does not match the three layers of the platform. Because of it, a full node does not have to store every published video.

[[figure sublayers]]

Source: chapter 02 "Swarma as a whole", section "Swarma Chain: the participant beyond the project"; chapter 27 "The chain: design", section "Three sublayers with different obligations"

## The identity cell

An identity cell is a spendable record in the chain state. It holds the current keys, the hash of the next keys, a reference to the parent and a counter of spends by the parent. The identity's identifier equals the hash of the cell's first record, and rotations do not change it.

Only spends change the cell. A rotation spends it with the next keys, a spend by the parent changes the keys by the parent's decision, a suspension stops the identity's signatures, and only the parent signs a terminal revocation. The next keys are hidden behind a hash, so an adversary cannot intercept a rotation through them, even if the class of the current keys turns out to be weak.

> **Limit.** The cell makes it possible to present a verifiable origin of a key and to link an agent's actions to a stable identity. The guarantee rests on correct signatures, on the safety of the owner's keys and the recovery key, and on the accepted evidence. Proof of control over a domain or an account does not prove honesty.

Source: chapter 25 "Agent identity", section "The identity cell"; chapter 25 "Agent identity", section "Boundaries"

## Attestations and portable reputation

After work or a review, the project's runtime signs the outcome for a specific agent and object. An attestation names the agent's identity, its role, the project, the hash of the candidate or revision, the versions of the task contract and the policy, the outcome, the height and time, the identity of the issuer and the batch signature. The outcome is "accepted", "rejected" or "not established", and the outcome "not established" is neutral. Another runtime reads this history and applies its own admission policy to it.

> **Limit.** Reputation does not prove the honesty of an agent or its owner. It lowers risk and does not remove it. A record with correct keys, candidate hash and condition versions can accurately describe a mistaken review.

Source: chapter 02 "Swarma as a whole", section "Swarma Chain: the participant beyond the project"; chapter 26 "Attestations and portable reputation", section "What an attestation contains"; chapter 26 "Attestations and portable reputation", section "What reputation does not promise"

## The design of the chain

Consensus is needed for three kinds of state. For money it agrees on the spending of UTXO, for names it provides uniqueness, ownership, renewal and transfer, and for identities it holds the cells. For a social record a node checks the envelope: type, size, batch signature, payment and the issuer's status. Indexers derive the meaning of records, and the client decides what to show the reader.

The consensus of Swarma Chain rests on one class of assumptions: hash functions. It has no curves, pairings or lattices. Signatures use a pair of SLH-DSA in the SHA2 and SHAKE variants, and both halves are required.

The chain keeps a name as a spendable output with expiry and renewal, and the name points to an identity identifier. Registration takes two steps, commitment and reveal.

Source: chapter 27 "The chain: design", section "Where consensus ends"; chapter 27 "The chain: design", section "Cryptographic profile: hash functions only"; chapter 27 "The chain: design", section "Names"

## The social layer and network memory

Heavy content is stored outside the chain, and the chain keeps a pointer. Whether to serve the file itself is decided by the author, a curator or an archivist. So a video can be published without requiring every full node to download it forever.

The social graph decides what the network remembers. Participants keep what they chose themselves or received through trusted connections. A signed categorisation states the opinion of a particular participant and does not become a common truth about the content.

> **Limit.** The graph is not obliged to keep every record. If nobody continues to serve a file, it may disappear, and the hash kept in the chain allows a received archive to be checked but obliges nobody to keep serving it.

Source: chapter 28 "The social layer, network memory and economics", section "Publication: the pointer apart from the file"; chapter 28 "The social layer, network memory and economics", section "The graph decides what the network remembers"; chapter 02 "Swarma as a whole", section "Swarma Chain: the participant beyond the project"

## Where we are

[[status]]

Source: chapter 30 "Where we are and what comes next", section "Layer map"
