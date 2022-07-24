<script>
	import { onMount } from 'svelte';
	import { page, navigating } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cipherHash, hash, unCipherHash } from './cipherHash';
	import Keyboard from 'svelte-keyboard';

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

	let pageHash = decodeURIComponent($page.url.hash) || '#chat';
	let pageServer = decodeURIComponent($page.url.pathname.slice(1)) || 'chit';

	let feedUpdate = 0;
	let feed = [];

	let channelList = ['chat', 'info', 'topics', 'events', 'links', 'news'];
	let serverList = ['chit'];
	let serverListUpdate = 0;

	let users = {};
	let usersConnected = 1;
	let muted = [];
	let mutedUpdate = 0;

	let inputs = {
		username: '',
		password: '',
		saveLogin: false,
		pinNumber: '',
		hashedPass: '',
		messageInput: '',
		privateMessageInput: '',
		encryptionPassword: '',
		searchTerm: '',
		connectTo: '',
		newServer: '',
		username: '',
		password: ''
	};

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
		document.querySelector('#chat').scrollTo(0, 100000000000000000);
	}

	let p2p;
	let encryptTF = false;
	let encryptionPasswordSet = false;

	function resetPassword() {
		inputs.encryptionPassword = '';
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
			usersConnected = Object.keys(users).length + 1;
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
			usersConnected = Object.keys(users).length + 1;
		});

		p2p = p2pt;
		p2pt.start();
	}

	function logout() {
		localStorage.removeItem('mutedUsers');
		localStorage.removeItem('channelList');
		localStorage.removeItem('serverList');
		localStorage.removeItem('channelList');
		localStorage.removeItem('hashedPass');
		localStorage.removeItem('username');
		window.location.reload();
	}

	function changeChannelInLine(e) {
		inputs.connectTo = e.target.innerText;
		changeChannel();
	}
	function changeChannel() {
		if (inputs.connectTo.trim() != '') {
			if (channelList.indexOf(inputs.connectTo) == -1) {
				channelList = [inputs.connectTo].concat(channelList);
				localStorage.channelList = JSON.stringify(channelList);
				channelListUpdate += 1;
			}

			goto('#' + inputs.connectTo);
			p2p.destroy();
			pageHash = '#' + inputs.connectTo;
			feed = [];
			feedUpdate += 1;
			usersConnected = 1;
			users = {};
			inputs.connectTo = '';
			runLogin();
		}
	}

	function changeServer() {
		if (inputs.newServer.trim() != '') {
			if (serverList.indexOf(inputs.newServer) == -1) {
				serverList = [inputs.newServer].concat(serverList);
				localStorage.serverList = JSON.stringify(serverList);
				serverListUpdate += 1;
			}

			goto('/' + inputs.newServer);
			p2p.destroy();
			pageServer = inputs.newServer;
			feed = [];
			feedUpdate += 1;
			usersConnected = 1;
			serverListUpdate += 1;
			users = {};
			inputs.newServer = '';
			runLogin();
		}
	}

	let channelListUpdate = 0;

	function removeChannel(e) {
		channelList.splice(parseInt(e.target.dataset.index), 1);
		localStorage.channelList = JSON.stringify(channelList);
		channelListUpdate += 1;
	}

	function send() {
		if (inputs.messageInput.trim()) {
			let msg = {
				username: profile.username,
				data: inputs.messageInput
			};
			if (encryptTF) {
				msg.data = `encrypt_begin ${cipherHash(
					inputs.messageInput,
					inputs.encryptionPassword
				)} encrypt_end`;
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
			inputs.messageInput = ``;
			scrollInView();
		}
	}

	let chatBar = {};
	let header = {};
	let WindowScroll = {};
	let innerHeight = 0;
	let innerWidth = 0;
	let mobile = innerWidth < 768;
	let focusedElement = null;
	let focusedElementName = null;

	function setFocus(e, name) {
		mobile = innerWidth < 768;
		if (mobile) {
			focusedElement = e.target;
			focusedElementName = name;
			document.querySelector('#keyboard').style.display = 'block';
			chatBar.style.height = 'calc(100vh - 420px)';
			window.scroll(0, 0);
		}
	}

	function setBlur(e) {
		if (mobile) {
			focusedElement = null;
			document.querySelector('#keyboard').style.display = 'none';
			chatBar.style.height = 'calc(100vh - 185px)';
			window.scroll(0, 0);
		}
	}

	const onKeydown = (event) => {
		console.log(event, inputs[focusedElementName]);
		if (event.detail == 'Backspace') {
			inputs[focusedElementName] = inputs[focusedElementName].slice(0, -1);
		} else if (event.detail == 'Space') {
			inputs[focusedElementName] += ' ';
		} else if (event.detail == 'Enter') {
			const evt = new KeyboardEvent('keydown', { key: 'Enter' });
			focusedElement.dispatchEvent(evt);
		} else {
			inputs[focusedElementName] += event.detail;
		}
	};

	let privateMessageUser = '';
	let privateMessageData = {};
	function openPrivateMsg(e) {
		let userId = e.target.dataset.user;
		console.log(users);
		privateMessageUser = users[userId].profile.username;
		privateMessageData = users[userId].peerData;
	}

	function sendPM() {
		if (inputs.privateMessageInput.trim()) {
			let msg = {
				username: profile.username,
				data: inputs.privateMessageInput,
				private: true
			};
			if (encryptTF) {
				msg.data = `encrypt_begin ${cipherHash(
					inputs.privateMessageInput,
					inputs.encryptionPassword
				)} encrypt_end`;
			}
			try {
				let d = new Date();
				p2p.send(
					privateMessageData,
					cipherHash(JSON.stringify(msg), privateMessageData.id + myPeerId)
				);
				msg.time = `${d.getMonth() + 1}/${d.getDate() + 1}/${d.getFullYear()} at ${d
					.getHours()
					.toString()
					.padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
				feed.push(msg);
				feedUpdate += 1;
				inputs.privateMessageInput = ``;
				scrollInView();
			} catch (error) {
				console.log(error);
			}
		}
	}

	function login() {
		console.log(inputs.pinNumber);
		if (inputs.saveLogin && inputs.hashedPass == undefined) {
			localStorage.hashedPass = hash(inputs.username + inputs.password);
			localStorage.username = inputs.username;
			let tag = hash(localStorage.hashedPass + inputs.pinNumber).slice(0, 4);
			profile.username = inputs.username + '#' + tag;
		} else if (inputs.hashedPass != undefined) {
			let tag = hash(inputs.hashedPass + inputs.pinNumber).slice(0, 4);
			profile.username = inputs.username + '#' + tag;
		} else {
			let tag = hash(inputs.username + inputs.password).slice(0, 4);
			profile.username = inputs.username + '#' + tag;
		}
		runLogin();
	}

	onMount(() => {
		inputs.hashedPass = localStorage.hashedPass;
		inputs.username = localStorage.username || '';

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

		document.querySelector('#loginBox').addEventListener('keydown', (e) => {
			if (e.key == 'Enter') {
				login();
				document.querySelector('label[ for="login-modal"]').click();
			}
		});

		document.querySelector('#serverInput').addEventListener('keydown', (e) => {
			if (e.key == 'Enter') {
				changeServer();
				document.querySelector('label[ for="my-modal-7"]').click();
			}
		});

		document.querySelector('#channelNameInput').addEventListener('keydown', (e) => {
			if (e.key == 'Enter') {
				changeChannel();
				document.querySelector('label[ for="my-modal"]').click();
			}
		});
	});

	function encryptKd(e) {
		console.log(e);
		if (e.key == 'Enter') {
			setPassword();
		}
	}

	function decryptMsg(e) {
		let element = document.querySelector(`kbd[data-id="${e.target.dataset.id}"]`);
		if (
			element.innerText.indexOf('encrypt_begin') > -1 &&
			element.innerText.indexOf('encrypt_end') > -1
		) {
			if (inputs.encryptionPassword != '') {
				element.innerText = unCipherHash(
					element.innerText.slice(14, -12),
					inputs.encryptionPassword
				);
			} else {
				encryptTF = true;
			}
		} else {
			if (inputs.encryptionPassword != '') {
				element.innerText =
					'encrypt_begin ' +
					cipherHash(element.innerText, inputs.encryptionPassword) +
					' encrypt_end';
			} else {
				encryptTF = true;
			}
		}
	}
	let channelsOpen = false;
	function openChannels() {
		if (document.querySelector('#channels').style.display == 'flex') {
			channelsOpen = false;
			document.querySelector('#channels').style.display = 'none';
			document.querySelector('#mainChat').style.display = 'flex';
			document.querySelector('#peopleOnline').style.display = 'none';
		} else {
			channelsOpen = true;
			document.querySelector('#channels').style.display = 'flex';
			document.querySelector('#mainChat').style.display = 'none';
			document.querySelector('#peopleOnline').style.display = 'none';
		}
	}
	function openConnected() {
		mobile = innerWidth < 768;
		if (mobile) {
			if (document.querySelector('#peopleOnline').style.display == 'block') {
				document.querySelector('#channels').style.display = 'none';
				document.querySelector('#mainChat').style.display = 'flex';
				document.querySelector('#peopleOnline').style.display = 'none';
			} else {
				document.querySelector('#channels').style.display = 'none';
				document.querySelector('#mainChat').style.display = 'none';
				document.querySelector('#peopleOnline').style.display = 'block';
			}
		}
	}
</script>

<svelte:window bind:scrollY={WindowScroll} bind:innerHeight bind:innerWidth />

<svelte:head>
	<title>/{pageHash}</title>
</svelte:head>

<div class="md:hidden">
	<div class="fixed top-[20px] left-[-10px]" on:click={openChannels}>
		{#if channelsOpen}
			<!-- svelte-ignore a11y-missing-attribute -->
			<img
				src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAANxJREFUSEvtlN0NwjAMhK/yAmwCI5QNYJNImSNSNoEN6AiwCQtYQpZSBMb5e4h4aR8r5z77zsmEwd80WB8boOrwfy3y3p+YeYkxPq1WnXM7IppDCNfcKNkJRBzABcCdmY8aksRvAA4AzjlIFpAEFgB7DVHiD2aec1MWM7AgYgURrZ0XxaW2GrKGJK/Flqp4E0CKFER+NYn3AlZb5JwZvLVJrRa9PU8iP8F3r+mHNV+BppDN7eqaoLSKpRXWkJaLZgaqIP0XTToZ+lRUn8nGguoWNepkyzZA1cHhFr0AuYqaGdJ1GnkAAAAASUVORK5CYII="
				width="45px"
			/>
		{:else}
			<!-- svelte-ignore a11y-missing-attribute -->
			<img
				src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAFJJREFUSEtjZKAxYKSx+QyjFhAMYfoHUXFx8X+CzsKjoLe3F8XRGD6guQWUuB6bXvrHAc19QPM4oLkFNA+ioW8BzeOA5hYM/TgY9QF6CNC8NAUA9ScYGaEbDGEAAAAASUVORK5CYII="
				width="45px"
			/>
		{/if}
	</div>
</div>

<div
	class="navbar bg-base-100 flex justify-between px-[5%] pt-[20px]"
	bind:this={header}
	on:click={openConnected}
>
	<a class="btn btn-ghost normal-case text-xl" href="{pageServer}/{pageHash}"
		>{pageServer}/{pageHash}</a
	>
	<div>
		{#if usersConnected > 1}
			<div class="badge badge-success mr-2 p-[9px] text-sm">
				<b>Connected: {usersConnected}</b>
			</div>
		{:else if usersConnected == 1}
			<div class="badge badge-warning mr-2 p-[9px] text-sm">
				<b>Connected: {usersConnected}</b>
			</div>
		{:else}
			<div class="badge badge-error mr-2 p-[9px] text-sm">
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
				readonly={mobile}
				bind:value={inputs.connectTo}
				on:focus={(e) => {
					setFocus(e, 'connectTo');
				}}
				on:blur={setBlur}
				id="channelNameInput"
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
				readonly={mobile}
				bind:value={inputs.newServer}
				on:focus={(e) => {
					setFocus(e, 'newServer');
				}}
				on:blur={setBlur}
				id="serverInput"
			/>
		</p>
		<div class="modal-action">
			<label for="my-modal-7" class="btn bg-secondary text-neutral" on:click={changeServer}
				>Add</label
			>
		</div>
	</div>
</div>

<div class="flex justify-between channelMenu">
	<!-- Channels -->
	<div class="w-80 ml-[10px] mb-[25px] md:flex flex-col justify-between hidden" id="channels">
		<ul class="menu bg-base-100">
			<input
				type="text"
				placeholder="Search Channels"
				class="input input-bordered w-full max-w-xs mb-[10px] text-[16px]"
				readonly={mobile}
				bind:value={inputs.searchTerm}
				on:focus={(e) => {
					setFocus(e, 'searchTerm');
				}}
				on:blur={setBlur}
			/>
			{#key channelListUpdate}
				{#each channelList as channel, i}
					{#if channel.toLowerCase().indexOf(inputs.searchTerm.toLowerCase()) > -1}
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
				bind:value={inputs.newServer}
				on:change={changeServer}
			>
				<option disabled selected value={inputs.newServer}>Switch Server</option>
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
	<div class="w-[100vw] flex flex-col md:justify-center items-center" id="mainChat">
		<div class="w-[100%] max-w-[900px]">
			<div
				class="chatBar mb-[20px] overflow-y-auto scrollbar max-w-[900px] w-[90%] mx-auto"
				bind:this={chatBar}
				id="chat"
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
						<div class="p-[10px] rounded-md break-all">
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
			<div class="w-[100%] max-w-[900px] mx-auto">
				<div class="form-control">
					<div class="flex w-[100%]">
						<input
							type="text"
							id="messageBar"
							placeholder="Message {pageHash}"
							class="input input-bordered bg-neutral w-[100%] text-[16px] md:rounded-bl-lg md:rounded-tl-lg rounded-none"
							readonly={mobile}
							bind:value={inputs.messageInput}
							on:focus={(e) => {
								setFocus(e, 'messageInput');
							}}
							on:blur={setBlur}
						/>
						<button
							class="btn btn-square px-[10px] hidden md:flex md:rounded-bl-none md:rounded-tl-none"
							on:click={send}
						>
							Send
						</button>
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
	</div>

	<!-- Members Online -->
	<ul
		class="md:menu hidden bg-base-100 w-80 mr-[10px] ml-[10px] md:ml-0 text-[20px] md:text-[17px] text-gray-500"
		id="peopleOnline"
	>
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
			<div class="text-gray-500 cursor-pointer mt-[20px]"><b>Muted</b></div>
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

<div class="hidden fixed bottom-0 left-[-1px] w-[100vw] z-[100000] bg-black" id="keyboard">
	<Keyboard
		on:keydown={onKeydown}
		--background="#1f2938"
		--color="#959ca8"
		--box-shadow="2px 2px 2px 0 #424a55"
		--active-background="#959ca8"
		--active-color="#1f2938"
		--active-transform="translate(2px, 2px)"
	/>
</div>
<!-- 
    Login
 -->

{#if inputs.hashedPass == undefined}
	<input type="checkbox" id="login-modal" class="modal-toggle" checked />
	<div class="modal">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Login</h3>
			<p class="py-4">
				<input
					type="text"
					placeholder="Username"
					class="input w-full max-w-xs bg-neutral mb-[10px] text-[16px]"
					readonly={mobile}
					bind:value={inputs.username}
					on:focus={(e) => {
						setFocus(e, 'username');
					}}
					on:blur={setBlur}
				/>
				<input
					type="text"
					placeholder="Password"
					class="input w-full max-w-xs bg-neutral text-[16px]"
					readonly={mobile}
					bind:value={inputs.password}
					on:focus={(e) => {
						setFocus(e, 'password');
					}}
					on:blur={setBlur}
				/>
			</p>
			<div class="form-control">
				<label class="label cursor-pointer w-fit">
					<span class="label-text">Remember me</span>
					<input type="checkbox" bind:checked={inputs.saveLogin} class="checkbox-xs ml-[10px]" />
				</label>
			</div>
			{#if inputs.saveLogin}
				<p class="py-4">
					<input
						type="text"
						placeholder="Login pin"
						class="input w-full max-w-xs bg-neutral text-[16px]"
						readonly={mobile}
						bind:value={inputs.pinNumber}
						on:focus={(e) => {
							setFocus(e, 'pinNumber');
						}}
						on:blur={setBlur}
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
			<p class="py-4 flex">
				<input
					type="text"
					placeholder="Login pin"
					class="input w-full max-w-xs bg-neutral text-[16px]"
					readonly={mobile}
					bind:value={inputs.pinNumber}
					on:focus={(e) => {
						setFocus(e, 'pinNumber');
					}}
					on:blur={setBlur}
					id="loginBox"
				/>
			</p>
			<div class="modal-action">
				<label for="login-modal" class="btn bg-secondary text-neutral joinButton" on:click={login}
					>Join</label
				>
				<button class="btn btn-outline btn-error" on:click={logout}>Logout</button>
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
			readonly={mobile}
			bind:value={inputs.privateMessageInput}
			on:focus={(e) => {
				setFocus(e, 'privateMessageInput');
			}}
			on:blur={setBlur}
		/>
		<label class="label cursor-pointer w-fit">
			<span class="label-text mr-[10px]">Encrypt</span>
			<input type="checkbox" class="toggle toggle-accent" bind:checked={encryptTF} />
		</label>
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
					id="encryptBar"
					placeholder="Enter Password"
					class="input input-bordered bg-neutral w-[100%] text-[16px]"
					readonly={mobile}
					bind:value={inputs.encryptionPassword}
					on:keydown={encryptKd}
					on:focus={(e) => {
						setFocus(e, 'encryptionPassword');
					}}
					on:blur={setBlur}
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
