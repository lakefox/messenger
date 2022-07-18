<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cipherHash, hash } from './cipherHash';

	// Find public WebTorrent tracker URLs here : https://github.com/ngosang/trackerslist/blob/master/trackers_all_ws.txt
	var trackersAnnounceURLs = [
		'wss://tracker.openwebtorrent.com',
		'wss://tracker.sloppyta.co:443/',
		'wss://tracker.novage.com.ua:443/',
		'wss://tracker.btorrent.xyz:443/',
		'ws://tracker.files.fm:7072/announce',
		'ws://tracker.files.fm:7073/announce',
		'wss://spacetradersapi-chatbox.herokuapp.com:443/announce'
	];

	console.log($page.url);
	let pageHash = $page.url.hash || '#all';

	let feedUpdate = 0;
	let feed = [
		{
			username: 'BOT',
			data: 'Beginning message history.',
			time: `${new Date().getMonth() + 1}/${
				new Date().getDate() + 1
			}/${new Date().getFullYear()} at ${new Date()
				.getHours()
				.toString()
				.padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`
		}
	];
	let users = {};
	let usersConnected = 1;

	let profile = {
		username: 'lakefox',
		profile: true
	};

	function scrollInView() {
		document.querySelector('#scrollTo').scrollIntoView();
	}

	let p2p;
	let encryptTF = false;
	let encryptionPassword = '';

	function runLogin() {
		// This 'myApp' is called identifier and should be unique to your app
		var p2pt = new P2PT(trackersAnnounceURLs, 'llib-' + pageHash);
		p2pt.on('trackerconnect', (tracker, stats) => {});
		// If a new peer, send message
		p2pt.on('peerconnect', (peer) => {
			users[peer.id] = {};
			users[peer.id].peerData = peer;
			usersConnected += 1;
			p2pt.send(peer, JSON.stringify(profile));
		});

		// If message received from peer
		p2pt.on('msg', (peer, msg) => {
			let data = JSON.parse(msg);
			if (data.profile) {
				users[peer.id].profile = data;
			} else {
				let d = new Date();
				data.userid = peer.id;
				data.time = `${d.getMonth() + 1}/${d.getDate() + 1}/${d.getFullYear()} at ${d
					.getHours()
					.toString()
					.padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
				feed.push(data);
				feedUpdate += 1;
				scrollInView();
			}
		});

		p2pt.on('peerclose', (peer) => {
			delete users[peer.id];
			usersConnected -= 1;
		});

		p2p = p2pt;
		p2pt.start();
	}

	let connectTo = '';

	function changeServer() {
		if (connectTo.trim() != '') {
			goto('#' + connectTo);
			runLogin();
			pageHash = '#' + connectTo;
			feed = [];
			feedUpdate += 1;
		}
	}

	let messageInput = '';

	function send() {
		if (messageInput.trim()) {
			let msg = {
				username: profile.username,
				data: messageInput
			};
			if (encryptTF) {
				msg.data = `encrypt_begin ${cipherHash(messageInput, encryptionPassword)} encrypt_end`;
			}
			for (const peer in users) {
				if (Object.hasOwnProperty.call(users, peer)) {
					const element = users[peer];
					try {
						p2p.send(element.peerData, JSON.stringify(msg));
					} catch (error) {
						console.log(error);
					}
				}
			}
			let d = new Date();
			msg.time = `${d.getMonth() + 1}/${d.getDate() + 1}/${d.getFullYear()} at ${d
				.getHours()
				.toString()
				.padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
			feed.push(msg);
			feedUpdate += 1;
			messageInput = ``;
			scrollInView();
		}
	}

	let chatBar = {};
	let header = {};
	let WindowScroll = {};
	let innerHeight = 0;
	let innerWidth = 0;
	function shrink() {
		if (innerHeight > innerWidth) {
			chatBar.style.height = 'calc(50vh - 150px)';
		}
	}

	function expand() {
		if (innerHeight > innerWidth) {
			chatBar.style.height = 'calc(100vh - 170px)';
		}
	}

	let privateMessageUser = '';
	let privateMessageData = {};
	let privateMessageInput = '';
	function openPrivateMsg(e) {
		let userId = e.target.dataset.user;
		console.log(users);
		privateMessageUser = users[userId].profile.username;
		privateMessageData = users[userId].peerData;
	}

	function sendPM() {
		if (privateMessageInput.trim()) {
			let msg = {
				username: profile.username,
				data: privateMessageInput,
				private: true
			};
			try {
				let d = new Date();
				p2p.send(privateMessageData, JSON.stringify(msg));
				msg.time = `${d.getMonth() + 1}/${d.getDate() + 1}/${d.getFullYear()} at ${d
					.getHours()
					.toString()
					.padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
				feed.push(msg);
				feedUpdate += 1;
				privateMessageInput = ``;
				scrollInView();
			} catch (error) {
				console.log(error);
			}
		}
	}

	let username = '';
	let password = '';
	function login() {
		if (username == '' || password == '') {
			alert('Please enter a username and password for this session');
		} else {
			let tag = hash(username + password).slice(0, 4);
			profile.username = username + '#' + tag;
			runLogin();
		}
	}

	onMount(() => {
		document.querySelector('#messageBar').addEventListener('keydown', (e) => {
			if (e.key == 'Enter') {
				send();
			}
		});

		document.querySelector('#privateBar').addEventListener('keydown', (e) => {
			if (e.key == 'Enter') {
				sendPM();
				document.querySelector('#closePrivate').click();
			}
		});
	});
</script>

<svelte:window bind:scrollY={WindowScroll} bind:innerHeight bind:innerWidth />

<!-- 
	encrypt password
 -->

{#key encryptTF}
	{#if encryptTF == true}
		<input type="checkbox" id="my-modal-4" class="modal-toggle" checked />
		<div class="modal">
			<div class="modal-box relative">
				<label for="my-modal-4" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
				<div class="mb-[10px]">Set Encryption Password</div>
				<input
					type="text"
					id="privateBar"
					placeholder="Enter Password"
					class="input input-bordered bg-neutral w-[100%] text-[16px]"
					bind:value={encryptionPassword}
				/>
				<div class="modal-action">
					<label for="my-modal-4" class="btn bg-secondary text-neutral">Set</label>
				</div>
			</div>
		</div>
	{/if}
{/key}

<div class="navbar bg-base-100 flex justify-between px-[5%] pt-[20px]" bind:this={header}>
	<a class="btn btn-ghost normal-case text-xl" href="/#{pageHash}">llib/{pageHash}</a>
	<div>
		{#if usersConnected > 1}
			<div class="badge badge-success mr-2 p-[9px] text-[9px] md:text-sm">
				<b>Connected: {usersConnected}</b>
			</div>
		{:else if usersConnected == 1}
			<div class="badge badge-warning mr-2 p-[9px] text-[9px] md:text-sm">
				<b>Connected: {usersConnected}</b>
			</div>
		{:else}
			<div class="badge badge-error mr-2 p-[9px] text-[9px] md:text-sm">
				<b>Connected: {Math.max(usersConnected, 0)}</b>
			</div>
		{/if}

		<label for="my-modal" class="btn modal-button bg-info">Change Servers</label>
	</div>
</div>

<!-- 
    Change server
 -->

<input type="checkbox" id="my-modal" class="modal-toggle" />
<div class="modal">
	<div class="modal-box">
		<label for="my-modal" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
		<h3 class="font-bold text-lg">Enter Server Name</h3>
		<p class="py-4 flex justify-center">
			<input
				type="text"
				placeholder="Type here"
				class="input w-full max-w-xs bg-neutral"
				bind:value={connectTo}
			/>
		</p>
		<div class="divider">OR</div>
		<div class="flex justify-center">
			<select class="select select-bordered w-full max-w-xs" bind:value={connectTo}>
				<option disabled selected value="">Select a Server</option>
				<option value="all">All</option>
				<option value="tech">Technology</option>
				<option value="general">General</option>
				<option value="ask">Ask</option>
				<option value="programming">Programming</option>
				<option value="piracy">Piracy</option>
			</select>
		</div>
		<div class="modal-action">
			<label for="my-modal" class="btn bg-secondary text-neutral" on:click={changeServer}
				>Join</label
			>
		</div>
	</div>
</div>

<div class="mx-auto">
	<div
		class="chatBar mb-[20px] overflow-y-auto scrollbar max-w-[90%] w-[900px] mx-auto"
		bind:this={chatBar}
	>
		{#key feedUpdate}
			{#each feed as post}
				<div class="p-[10px] rounded-md">
					<div class="flex justify-between">
						{#if post.username == profile.username}
							<div class="text-primary">
								{post.username}
							</div>
						{:else if post.username == 'BOT'}
							<div class="text-gray-500">
								{post.username}
							</div>
						{:else}
							<label for="my-modal-3">
								<div
									class="text-gray-500 underline cursor-pointer"
									on:click={openPrivateMsg}
									data-user={post.userid}
								>
									{post.username}
								</div>
							</label>
						{/if}

						<div class="text-xs text-gray-600">
							{post.time}
						</div>
					</div>

					{#if post.private}
						<div class="text-gray-20 bg-neutral p-[3px] pl-[10px] rounded-sm">
							{#if post.data.indexOf('encrypt_begin') > -1 && post.data.indexOf('encrypt_end') > -1}
								<kbd class="kbd mt-[3px] bg-gray-900 text-gray-100 cursor-pointer">{post.data}</kbd>
							{:else}
								{post.data}
							{/if}
						</div>
					{:else}
						<div class="text-gray-20">
							{#if post.data.indexOf('encrypt_begin') > -1 && post.data.indexOf('encrypt_end') > -1}
								<kbd class="kbd mt-[3px] bg-gray-900 text-gray-100 cursor-pointer">{post.data}</kbd>
							{:else}
								{post.data}
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		{/key}
		<div id="scrollTo" class="h-[10px]" />
	</div>
	<div class="max-w-[100%] w-[900px] mx-auto">
		<div class="form-control">
			<div class="input-group w-[100%]">
				<input
					type="text"
					id="messageBar"
					placeholder="Message {pageHash}"
					class="input input-bordered bg-neutral w-[100%] text-[16px]"
					bind:value={messageInput}
					on:focus={shrink}
					on:blur={expand}
				/>
				<button class="btn btn-square px-[10px]" on:click={send}> Send </button>
			</div>
			<div>
				<label class="label cursor-pointer w-fit float-right">
					<span class="label-text mr-[10px]">Encrypt</span>
					<input type="checkbox" class="toggle toggle-accent" bind:checked={encryptTF} />
				</label>
			</div>
		</div>
	</div>
</div>

<!-- 
    Login
 -->

<input type="checkbox" id="login-modal" class="modal-toggle" checked />
<div class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Login</h3>
		<p class="py-4">
			<input
				type="text"
				placeholder="Username"
				class="input w-full max-w-xs bg-neutral mb-[10px]"
				bind:value={username}
			/>
			<input
				type="password"
				placeholder="Password"
				class="input w-full max-w-xs bg-neutral"
				bind:value={password}
			/>
		</p>
		<div class="modal-action">
			<label for="login-modal" class="btn bg-secondary text-neutral" on:click={login}>Join</label>
		</div>
	</div>
</div>

<!-- 
	Private Message
 -->

<input type="checkbox" id="my-modal-3" class="modal-toggle" />
<div class="modal">
	<div class="modal-box relative">
		<label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
		<div class="mb-[10px]">Private Message</div>
		<input
			type="text"
			id="privateBar"
			placeholder="Message {privateMessageUser}"
			class="input input-bordered bg-neutral w-[100%] text-[16px]"
			bind:value={privateMessageInput}
		/>
		<div class="modal-action">
			<label
				for="my-modal-3"
				id="closePrivate"
				class="btn bg-secondary text-neutral"
				on:click={sendPM}>Send</label
			>
		</div>
	</div>
</div>
