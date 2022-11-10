<script lang="ts">
	import { onMount } from 'svelte';
	import { create } from '@aviarytech/did-peer';
	import {
		Ed25519VerificationKey2020,
		sha256,
		X25519KeyAgreementKey2020
	} from '@aviarytech/crypto';
	import { DIDComm, protocols } from '$lib';
	import { DIDResolver, JSONSecretResolver } from '@aviarytech/dids';
	import type { IDIDComm } from '$lib/interfaces';
	import { nanoid } from 'nanoid';

	let mediatorDID = 'did:web:aviary.pub';
	let mediatorURL = 'https://aviary.pub/.well-known/did.json';

	let did: string;
	let secrets: any[];
	let didcomm: IDIDComm;

	onMount(async () => {
		const authKey = await Ed25519VerificationKey2020.generate();
		const encKey = await X25519KeyAgreementKey2020.generate();
		did = await create(2, [authKey], [encKey], {
			id: '#didcomm',
			type: 'DIDCommMessaging',
			serviceEndpoint: mediatorURL,
			routingKeys: [mediatorDID]
		});
		secrets = [
			{
				...(await authKey.export({ privateKey: true, type: 'JsonWebKey2020' })),
				id: `#${authKey.publicKeyMultibase.slice(1, 9)}`,
				controller: did
			},
			{
				...(await encKey.export({ privateKey: true, type: 'JsonWebKey2020' })),
				id: `#${encKey.publicKeyMultibase.slice(1, 9)}`,
				controller: did
			}
		];
		didcomm = new DIDComm([], new DIDResolver(), new JSONSecretResolver(secrets[1]));
	});

	const sendPing = async () => {
		const to =
			'did:peer:2.Vz8dvsn9dUVyWjcrCNcsS4Ajv22xkokhiAzkgdcSKiVwkU.Ez6uDTaNPu2cvE7FHAcVDurEmLdrXGa8D99e6TozorazhM.SeyJpZCI6IiNkaWRjb21tIiwidCI6ImRtIiwicyI6Imh0dHBzOi8vYXZpYXJ5LnB1Yi9kaWRjb21tIiwiciI6WyJkaWQ6d2ViOmF2aWFyeS5wdWIiXX0';
		const sent = await didcomm.sendMessage(to, {
			payload: {
				id: sha256(nanoid()),
				type: protocols.TrustPing.TRUST_PING_PING_TYPE,
				to: [to],
				from: did,
				created_time: Math.floor(Date.now() / 1000),
				body: {
					response_requested: true
				}
			},
			repudiable: false
		});
		console.log(sent);
	};
</script>

<button on:click={sendPing}>Ping</button>
