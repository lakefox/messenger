import { g as getContext, c as create_ssr_component, a as subscribe, b as add_attribute, e as escape, d as each } from "../../immutable/chunks/index-e88adad9.js";
import "../endpoints/cipherHash.js";
const getStores = () => {
  const stores = getContext("__svelte__");
  return {
    page: {
      subscribe: stores.page.subscribe
    },
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    get preloading() {
      console.error("stores.preloading is deprecated; use stores.navigating instead");
      return {
        subscribe: stores.navigating.subscribe
      };
    },
    session: stores.session,
    updated: stores.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  console.log($page.url);
  let pageHash = $page.url.hash || "#all";
  let feed = [
    {
      username: "BOT",
      data: "Beginning message history.",
      time: `${new Date().getMonth() + 1}/${new Date().getDate() + 1}/${new Date().getFullYear()} at ${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`
    }
  ];
  let usersConnected = 1;
  let profile = { username: "lakefox", profile: true };
  let connectTo = "";
  let messageInput = "";
  let chatBar = {};
  let header = {};
  let privateMessageUser = "";
  let privateMessageInput = "";
  let username = "";
  let password = "";
  $$unsubscribe_page();
  return `

<div class="${"navbar bg-base-100 flex justify-between px-[5%] pt-[20px]"}"${add_attribute("this", header, 0)}><a class="${"btn btn-ghost normal-case text-xl"}" href="${"/#" + escape(pageHash, true)}">llib/${escape(pageHash)}</a>
	<div>${`${`<div class="${"badge badge-warning mr-2 p-[9px] text-[9px] md:text-sm"}"><b>Connected: ${escape(usersConnected)}</b></div>`}`}

		<label for="${"my-modal"}" class="${"btn modal-button"}">Change Servers</label></div></div>



<input type="${"checkbox"}" id="${"my-modal"}" class="${"modal-toggle"}">
<div class="${"modal"}"><div class="${"modal-box"}"><h3 class="${"font-bold text-lg"}">Enter Server Name</h3>
		<p class="${"py-4"}"><input type="${"text"}" placeholder="${"Type here"}" class="${"input w-full max-w-xs bg-neutral"}"${add_attribute("value", connectTo, 0)}></p>
		<div class="${"modal-action"}"><label for="${"my-modal"}" class="${"btn bg-secondary text-neutral"}">Join</label></div></div></div>

<div class="${"mx-auto"}"><div class="${"chatBar mb-[20px] overflow-y-auto scrollbar max-w-[90%] w-[900px] mx-auto"}"${add_attribute("this", chatBar, 0)}>${each(feed, (post) => {
    return `<div class="${"p-[10px] rounded-md"}"><div class="${"flex justify-between"}">${post.username == profile.username ? `<div class="${"text-primary"}">${escape(post.username)}
							</div>` : `${post.username == "BOT" ? `<div class="${"text-gray-500"}">${escape(post.username)}
							</div>` : `<label for="${"my-modal-3"}"><div class="${"text-gray-500 underline cursor-pointer"}"${add_attribute("data-user", post.userid, 0)}>${escape(post.username)}</div>
							</label>`}`}

						<div class="${"text-xs text-gray-600"}">${escape(post.time)}
						</div></div>

					${post.private ? `<div class="${"text-gray-20 bg-neutral p-[3px] pl-[10px] rounded-sm"}">${escape(post.data)}
						</div>` : `<div class="${"text-gray-20"}">${escape(post.data)}
						</div>`}
				</div>`;
  })}
		<div id="${"scrollTo"}" class="${"h-[10px]"}"></div></div>
	<div class="${"max-w-[100%] w-[900px] mx-auto"}"><div class="${"form-control"}"><div class="${"input-group w-[100%]"}"><input type="${"text"}" placeholder="${"Message " + escape(pageHash, true)}" class="${"input input-bordered bg-neutral w-[100%] text-[16px]"}"${add_attribute("value", messageInput, 0)}>
				<button class="${"btn btn-square px-[10px]"}">Send </button></div></div></div></div>



<input type="${"checkbox"}" id="${"login-modal"}" class="${"modal-toggle"}" checked>
<div class="${"modal"}"><div class="${"modal-box"}"><h3 class="${"font-bold text-lg"}">Login</h3>
		<p class="${"py-4"}"><input type="${"text"}" placeholder="${"Username"}" class="${"input w-full max-w-xs bg-neutral mb-[10px]"}"${add_attribute("value", username, 0)}>
			<input type="${"password"}" placeholder="${"Password"}" class="${"input w-full max-w-xs bg-neutral"}"${add_attribute("value", password, 0)}></p>
		<div class="${"modal-action"}"><label for="${"login-modal"}" class="${"btn bg-secondary text-neutral"}">Join</label></div></div></div>



<input type="${"checkbox"}" id="${"my-modal-3"}" class="${"modal-toggle"}">
<div class="${"modal"}"><div class="${"modal-box relative"}"><label for="${"my-modal-3"}" class="${"btn btn-sm btn-circle absolute right-2 top-2"}">\u2715</label>
		<div class="${"mb-[10px]"}">Private Message</div>
		<input type="${"text"}" placeholder="${"Message " + escape(privateMessageUser, true)}" class="${"input input-bordered bg-neutral w-[100%] text-[16px]"}"${add_attribute("value", privateMessageInput, 0)}>
		<div class="${"modal-action"}"><label for="${"my-modal-3"}" class="${"btn bg-secondary text-neutral"}">Send</label></div></div></div>`;
});
export {
  Routes as default
};
