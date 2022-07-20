<script>
	import { onMount } from 'svelte';
	import { page, navigating } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cipherHash, hash, unCipherHash } from './cipherHash';
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

	let pageHash = $page.url.hash || '#chat';
	let pageServer = $page.url.pathname.slice(1) || 'chit';

	let feedUpdate = 0;
	let feed = [];

	let searchTerm = '';

	let channelList = ['chat', 'info', 'topics', 'events', 'links', 'news'];
	let serverList = ['chit'];
	let serverListUpdate = 0;

	let newServer = '';

	let users = {};
	let usersConnected = 1;
	let muted = [];
	let mutedUpdate = 0;

	function muteUser(e) {
		let name = e.target.dataset.username;
		if (muted.indexOf(name) == -1) {
			muted.push(name);
			localStorage.mutedUsers = JSON.stringify(muted);
			mutedUpdate += 1;
		}
	}

	function removeMuted(e) {
		muted.splice(parseInt(e.target.dataset.index), 1);
		localStorage.mutedUsers = JSON.stringify(muted);
		mutedUpdate += 1;
	}

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
	let encryptionPasswordSet = false;

	function resetPassword() {
		encryptionPassword = '';
		encryptionPasswordSet = false;
		encryptTF = false;
	}
	function setPassword() {
		encryptionPasswordSet = true;
	}

	let profileUpdate = 0;
	let myPeerId = '';

	function runLogin() {
		// This 'myApp' is called identifier and should be unique to your app
		var p2pt = new P2PT(trackersAnnounceURLs, pageServer + '-' + pageHash);
		console.log(p2pt);
		myPeerId = p2pt._peerId;
		p2pt.on('trackerconnect', (tracker, stats) => {});
		// If a new peer, send message
		p2pt.on('peerconnect', (peer) => {
			console.log(peer);
			users[peer.id] = {};
			users[peer.id].peerData = peer;
			users[peer.id].profile = { profile: false };
			usersConnected += 1;
			p2pt.send(peer, JSON.stringify(profile));
		});

		// If message received from peer
		p2pt.on('msg', (peer, msg) => {
			if (msg[0] == '{') {
				let data = JSON.parse(msg);
				if (data.profile) {
					users[peer.id].profile = data;
					profileUpdate += 1;
				}
			} else {
				let data = JSON.parse(unCipherHash(msg, myPeerId + peer.id));
				let d = new Date();
				data.userid = peer.id;
				data.time = `${d.getMonth() + 1}/${d.getDate() + 1}/${d.getFullYear()} at ${d
					.getHours()
					.toString()
					.padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
				if (muted.indexOf(data.username) == -1) {
					feed.push(data);
					feedUpdate += 1;
					scrollInView();
				}
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

	function changeChannelInLine(e) {
		connectTo = e.target.innerText;
		changeChannel();
	}
	function changeChannel() {
		if (connectTo.trim() != '') {
			if (channelList.indexOf(connectTo) == -1) {
				channelList = [connectTo].concat(channelList);
				localStorage.channelList = JSON.stringify(channelList);
				channelListUpdate += 1;
			}

			goto('#' + connectTo);
			p2p.destroy();
			pageHash = '#' + connectTo;
			feed = [];
			feedUpdate += 1;
			usersConnected = 1;
			users = {};
			runLogin();
		}
	}

	function changeServer() {
		if (newServer.trim() != '') {
			if (serverList.indexOf(newServer) == -1) {
				serverList = [newServer].concat(serverList);
				localStorage.serverList = JSON.stringify(serverList);
				serverListUpdate += 1;
			}

			goto('/' + newServer);
			p2p.destroy();
			pageServer = newServer;
			feed = [];
			feedUpdate += 1;
			usersConnected = 1;
			serverListUpdate += 1;
			users = {};
			runLogin();
		}
	}

	let channelListUpdate = 0;

	function removeChannel(e) {
		channelList.splice(parseInt(e.target.dataset.index), 1);
		localStorage.channelList = JSON.stringify(channelList);
		channelListUpdate += 1;
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
						p2p.send(
							element.peerData,
							cipherHash(JSON.stringify(msg), users[peer].peerData.id + myPeerId)
						);
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
	let saveLogin = false;
	let pinNumber = '';
	let hashedPass = '';

	function login() {
		if (saveLogin && hashedPass == undefined) {
			localStorage.hashedPass = hash(username + password);
			localStorage.username = username;
			let tag = hash(hashedPass + pinNumber).slice(0, 4);
			profile.username = username + '#' + tag;
		} else if (hashedPass != undefined) {
			let tag = hash(hashedPass + pinNumber).slice(0, 4);
			profile.username = username + '#' + tag;
		} else {
			let tag = hash(username + password).slice(0, 4);
			profile.username = username + '#' + tag;
		}
		runLogin();
	}

	onMount(() => {
		hashedPass = localStorage.hashedPass;
		username = localStorage.username;

		if (localStorage.channelList) {
			channelList = JSON.parse(localStorage.channelList);
		}
		if (localStorage.serverList) {
			serverList = JSON.parse(localStorage.serverList);
		}

		if (localStorage.mutedUsers) {
			muted = JSON.parse(localStorage.mutedUsers);
		}

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

	function decryptMsg(e) {
		let element = document.querySelector(`kbd[data-id="${e.target.dataset.id}"]`);
		if (
			element.innerText.indexOf('encrypt_begin') > -1 &&
			element.innerText.indexOf('encrypt_end') > -1
		) {
			if (encryptionPassword != '') {
				element.innerText = unCipherHash(element.innerText.slice(14, -12), encryptionPassword);
			} else {
				encryptTF = true;
			}
		} else {
			if (encryptionPassword != '') {
				element.innerText =
					'encrypt_begin ' + cipherHash(element.innerText, encryptionPassword) + ' encrypt_end';
			} else {
				encryptTF = true;
			}
		}
	}
</script>

<svelte:window bind:scrollY={WindowScroll} bind:innerHeight bind:innerWidth />

<svelte:head>
	<title>/{pageHash}</title>
</svelte:head>

<!-- 
	encrypt password
 -->

{#key encryptTF}
	{#if encryptTF == true && !encryptionPasswordSet}
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
					<label for="my-modal-4" class="btn bg-secondary text-neutral" on:click={setPassword}
						>Set</label
					>
				</div>
			</div>
		</div>
	{/if}
{/key}

<div class="navbar bg-base-100 flex justify-between px-[5%] pt-[20px]" bind:this={header}>
	<a class="btn btn-ghost normal-case text-xl" href="{pageServer}/{pageHash}"
		>{pageServer}/{pageHash}</a
	>
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
	</div>
</div>

<!-- 
    Add channel
 -->

<input type="checkbox" id="my-modal" class="modal-toggle" />
<div class="modal">
	<div class="modal-box">
		<label for="my-modal" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
		<h3 class="font-bold text-lg">Create or add a channel</h3>
		<p class="py-4 flex justify-center">
			<input
				type="text"
				placeholder="Channel Name"
				class="input w-full max-w-xs bg-neutral text-[16px]"
				bind:value={connectTo}
			/>
		</p>
		<div class="modal-action">
			<label for="my-modal" class="btn bg-secondary text-neutral" on:click={changeChannel}
				>Add</label
			>
		</div>
	</div>
</div>

<!-- 
    Add server
 -->

<input type="checkbox" id="my-modal-7" class="modal-toggle" />
<div class="modal">
	<div class="modal-box">
		<label for="my-modal-7" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
		<h3 class="font-bold text-lg">Create or add a server</h3>
		<p class="py-4 flex justify-center">
			<input
				type="text"
				placeholder="Server Name"
				class="input w-full max-w-xs bg-neutral text-[16px]"
				bind:value={newServer}
			/>
		</p>
		<div class="modal-action">
			<label for="my-modal-7" class="btn bg-secondary text-neutral" on:click={changeServer}
				>Add</label
			>
		</div>
	</div>
</div>

<div class="flex">
	<!-- Channels -->
	<div class="w-56 ml-[10px] flex flex-col justify-between">
		<ul class="menu bg-base-100">
			<input
				type="text"
				placeholder="Search Channels"
				class="input input-bordered w-full max-w-xs mb-[10px] text-[16px]"
				bind:value={searchTerm}
			/>
			{#key channelListUpdate}
				{#each channelList as channel, i}
					{#if channel.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1}
						<li class="hover-bordered flex justify-between flex-row">
							<!-- svelte-ignore a11y-missing-attribute -->
							<a on:click={changeChannelInLine} class="menuWidth">
								{channel}
							</a>
							<span class="hover:text-error cursor-pointer" on:click={removeChannel} data-index={i}
								><b title="Remove?">-</b></span
							>
						</li>
					{/if}
				{/each}
			{/key}
			<label
				for="my-modal"
				class="btn-ghost modal-button text-center text-xl rounded cursor-pointer"
			>
				<b> + </b>
			</label>
		</ul>
		<div>
			<select
				class="select select-ghost w-full max-w-xs select-bordered mb-[10px] text-gray-600"
				bind:value={newServer}
				on:change={changeServer}
			>
				<option disabled selected value={newServer}>Switch Server</option>
				{#key serverListUpdate}
					{#each serverList as server}
						<option value={server}>{server}</option>
					{/each}
				{/key}
			</select>
			<label for="my-modal-7" class="btn btn-outline modal-button btn-info cursor-pointer w-[100%]">
				Create/Add Server
			</label>
		</div>
	</div>
	<!-- Main chat box -->
	<div class="mx-auto">
		<div
			class="chatBar mb-[20px] overflow-y-auto scrollbar max-w-[90%] w-[900px] mx-auto"
			bind:this={chatBar}
		>
			<div class="flex justify-between">
				<div class="text-gray-700">Starting message history</div>
				<div class="text-xs text-gray-600">
					{`${new Date().getMonth() + 1}/${
						new Date().getDate() + 1
					}/${new Date().getFullYear()} at ${new Date()
						.getHours()
						.toString()
						.padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`}
				</div>
			</div>
			{#key feedUpdate}
				{#each feed as post, i}
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
							<div
								class="text-gray-20 bg-neutral p-[3px] pl-[10px] rounded-sm flex justify-between"
							>
								{#if post.data.indexOf('encrypt_begin') > -1 && post.data.indexOf('encrypt_end') > -1}
									<kbd
										class="kbd mt-[3px] bg-gray-900 text-gray-100 cursor-pointer"
										on:click={decryptMsg}
										data-id={i}
									>
										{post.data}
									</kbd>
								{:else}
									{post.data}
								{/if}
								{#if post.username != profile.username}
									<div
										class="text-xs text-gray-600 cursor-pointer hover:underline"
										on:click={muteUser}
										data-username={post.username}
									>
										mute
									</div>
								{/if}
							</div>
						{:else}
							<div class="text-gray-20 flex justify-between">
								{#if post.data.indexOf('encrypt_begin') > -1 && post.data.indexOf('encrypt_end') > -1}
									<kbd
										class="kbd mt-[3px] bg-gray-900 text-gray-100 cursor-pointer"
										on:click={decryptMsg}
										data-id={i}
									>
										{post.data}
									</kbd>
								{:else}
									{post.data}
								{/if}
								{#if post.username != profile.username}
									<div
										class="text-xs text-gray-600 cursor-pointer hover:underline"
										on:click={muteUser}
										data-username={post.username}
									>
										mute
									</div>
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
				<div class="flex justify-end items-center">
					<label class="label cursor-pointer w-fit">
						<span class="label-text mr-[10px]">Encrypt</span>
						<input type="checkbox" class="toggle toggle-accent" bind:checked={encryptTF} />
					</label>
					<div class="badge badge-error cursor-pointer" on:click={resetPassword}>RESET</div>
				</div>
			</div>
		</div>
	</div>
	<!-- Members Online -->
	<ul class="menu bg-base-100 w-56 mr-[10px]">
		<li>
			<div class="text-gray-500 cursor-pointer"><b>Online</b></div>
		</li>
		{#key profileUpdate}
			{#if Object.keys(users).length > 0}
				{#each Object.keys(users) as user}
					{#if users[user].profile.profile}
						<li>
							<label for="my-modal-3">
								<div
									class="text-gray-500 underline cursor-pointer"
									on:click={openPrivateMsg}
									data-user={user}
								>
									{users[user].profile.username}
								</div>
							</label>
						</li>
					{/if}
				{/each}
			{:else}
				<li>
					<div class="text-gray-500 cursor-pointer">None</div>
				</li>
			{/if}
		{/key}
		<li>
			<div class="text-gray-500 cursor-pointer"><b>Muted</b></div>
		</li>
		{#key mutedUpdate}
			{#if muted.length > 0}
				{#each muted as user, i}
					<li class="hover-bordered flex justify-between flex-row">
						<div class="text-gray-500 cursor-pointer">{user}</div>
						<span class="hover:text-error cursor-pointer" on:click={removeMuted} data-index={i}
							><b title="Remove?">-</b></span
						>
					</li>
				{/each}
			{:else}
				<li>
					<div class="text-gray-500 cursor-pointer">None</div>
				</li>
			{/if}
		{/key}
	</ul>
</div>

<!-- 
    Login
 -->

{#if hashedPass == undefined}
	<input type="checkbox" id="login-modal" class="modal-toggle" checked />
	<div class="modal">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Login</h3>
			<p class="py-4">
				<input
					type="text"
					placeholder="Username"
					class="input w-full max-w-xs bg-neutral mb-[10px] text-[16px]"
					bind:value={username}
				/>
				<input
					type="password"
					placeholder="Password"
					class="input w-full max-w-xs bg-neutral text-[16px]"
					bind:value={password}
				/>
			</p>
			<div class="form-control">
				<label class="label cursor-pointer w-fit">
					<span class="label-text">Remember me</span>
					<input type="checkbox" bind:checked={saveLogin} class="checkbox-xs ml-[10px]" />
				</label>
			</div>
			{#if saveLogin}
				<p class="py-4">
					<input
						type="text"
						placeholder="Login pin"
						class="input w-full max-w-xs bg-neutral text-[16px]"
						bind:value={pinNumber}
					/>
				</p>
			{/if}
			<div class="modal-action">
				<label for="login-modal" class="btn bg-secondary text-neutral" on:click={login}>Join</label>
			</div>
		</div>
	</div>
{:else}
	<input type="checkbox" id="login-modal" class="modal-toggle" checked />
	<div class="modal">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Login with pin</h3>
			<p class="py-4">
				<input
					type="text"
					placeholder="Login pin"
					class="input w-full max-w-xs bg-neutral text-[16px]"
					bind:value={pinNumber}
				/>
			</p>
			<div class="modal-action">
				<label for="login-modal" class="btn bg-secondary text-neutral" on:click={login}>Join</label>
			</div>
		</div>
	</div>
{/if}

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
