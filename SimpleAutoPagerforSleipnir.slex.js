// ==UserScript==
// @name Simple AutomateMobilePager2 for Sleipnir
// @author shyntom
// @description autopager2 for sleipnir
// @include http://*
// @include https://*
// @require api-notification
// @require api
// @grant GM_xmlhttpRequest
// @grant GM_getValue
// @grant GM_setValue
// @noframes
// @version 2.1
// @history:ja      1.0 github参照に変更
// @history:ja      1.1 Hitしなかった際の詳細をStatus表示
// @history:ja      1.2 httprequestの同期動作を改善
// @history:ja      2.0 iframeに切り替え,siteinfo内の配列が長さ0の場合に、for処理でchromeはObject、sleipnirはundefinedでエラーになる
// @history:ja      2.1 siteinfo修正
// ==/UserScript==

(function() {
	if(top !== self) return false;

	function AutomateMobilePage(){  };

	AutomateMobilePage.prototype = {
		Settings: {
			siteinfo_urls: ['https://raw.githubusercontent.com/gktm2/testslexcode2/refs/heads/main/siteinfo.json'],
			AUTO_START: true,
			REMAIN_HEIGHT: 100,
			autoPgWait: 4000,
			LOCAL_SITEINFO: [

			{
				name: 'dyreitou感想',
				memo: ['sleipnirではurlencodeだめ','/%e7%ac%ac[0-9]+%e8%a9%b1'],
				data: {
					url: '^https?://dyreitou.com/.*[0-9]',
					nextLink: '//a[@class="prev page-numbers"]',
					pageElement: '//div[@class="comment-section"]',
					insertBefore: '//div[@class="comment-section"]/div[@class="st-pagelink"]',
				}
			},
			{
				"name": "rakuten",
				"memo": ["search view"],
				"data": {
					"url": "^https://search.rakuten.co.jp/search/mall/.*",
					"nextLink": "//a[@class='item nextPage']",
					"pageElement": "//DIV[@id='root']"
				}
			},
			{
				name:'narou mobile 本文',
				data:{
					pageElement: '//div[@class="l-container"]',
					nextLink: '//a[@class="c-pager__item c-pager__item--next"]',
					memo:'(//a[@class="c-pager__item"])[last()]',
					url: '^https?://ncode\.syosetu\.com/[0-9a-z]{7}/[0-9]{1,4}/$',
				},
			},
			{
				name:'narou mobile 感想回ごと',
				data:{
					pageElement: '//div[@class="l-container"]',
					memoelement: 'id("novel_contents")|id("contents_main")',
					nextLink: '//a[contains(text(), "Next") and contains(text(), ">>")][1]',
					memonextLink: '//a[contains(text(), "Next") and contains(text(), ">>")][1]',
					url: '^https?://novelcom\.syosetu\.com/impression/list/ncode/[0-9]{4,8}/no/[0-9]{1,4}/$',
					memoinsertBefore:'(//div[@class="page_bar"])[last()]/following::div',
					exampleurl: "https://novelcom.syosetu.com/impression/list/ncode/755380/no/139/"
				},
			},
			{
				name:'narou mobile 感想全体',
				data:{
					pageElement: '//div[@class="l-container"]',
					nextLink: '//a[contains(text(), "Next") and contains(text(), ">>")][1]',
					url: '^https?://novelcom\.syosetu\.com/impression/list/ncode/[0-9]{4,8}/$',
					exampleurl: "https://novelcom.syosetu.com/impression/list/ncode/755380/no/139/"
				},
			},
			{
				name:'narou お気に入りリスト',
				data:{
					pageElement: '//div[@class="l-container"]',
					nextLink: '//a[contains(text(), "次") and @class="c-up-pager__item"][1]',
					url: '^https?://syosetu.com/favnovelmain/list/',
					exampleurl: 'https://syosetu.com/favnovelmain/list/'
				},
			},
			{
				name:'narou 各話リスト',
				data:{
					pageElement: '//article[@class="p-novel"]',
					nextLink: '//a[@class = "c-pager__item c-pager__item--next"]',
					url: '^https?://ncode.syosetu.com/[0-9a-z]{7,}/',
					exampleurl: 'https://ncode.syosetu.com/n3930eh/'
				},
			},
			{
				name:'newpuru.doorblog.jp/',
				data:{
					pageElement: '//div[@class = "content"]',
					nextLink: '(//li[@class = "pager-next box-border"]/a)',
					url: '^https://newpuru.doorblog.jp/',
					insertBefore:'',
				},
			},
			{
				name:'kanasoku.s130',
				data:{
					pageElement: '//div[@id = "container"]',
					nextLink: '//a[@class = "square_btn"]',
					url: '^http://kanasoku.s130.coreserver.jp/',
				},
			},
			{
				name:'2channneler',
				memo:'最初のdodumentにはcontentなし',
				data:{
					pageElement: '//div[@class = "ui-content"]',
					nextLink: '(//a[@class="ui-btn ui-btn-up-c ui-btn-inline"])',
					url: '^https://2channeler.com/sp/',
				},
			},
			],
			MICROFORMATS: [],
			color: {
				on: '#00cc00',
				off: '#cccccc',
				loading: '#0000cc',
				timeout: '#00cccc',
				finish: '#cccc00',
				outofservice: '#cccc00',
				error: '#cc0000'
			}
		},
		useWedata: true,
		pageCount:1,
		accessCount: 0,
		isSleipnir: false,
		nextUrl: null,
		tempinsertPointSeparator: null,
		insertPoint: null,
		previousY: 0,
		previousRatio: 0,
		TempscrollListener: null,
		TempclickListener: null,
		InsertContainer: `<div id="insertPointSeparator" style="z-index: 2147483645; width: 100%; left: 0%; font-size: 2em;">--Next insert here--</div>`,
		Observer: null,
		Observeroptions:  {
				root: null,
				rootMargin:   '0px 0px 0px 0px',
				threshold: 0,
		},
		ObserverInit: true,
		siteinfo: null,
		filters: [],
		documentFilters: [],
		pages: null,
		NextPgDocument: null,
		ConsoleTxT: "",
		PageHeight: 100,

		initialize:async function() {
			/* プラットフォームをチェック */
			this.isSleipnir = 'undefined' != typeof SLEX_locale;
			
			/* ステータスアイコンを追加 */
			this.addIcon();
			let statusIcon = document.getElementById('autopagerize_icon');
			/* イベントに登録:mousedownだとロングクリックで発動しない。今のところ原因不明。 */
			statusIcon.addEventListener('touchstart', function(event){
				this.TapEvent(event);
			}.bind(this), false);
			
			/* 処理を開始 */
			this.getSiteinfo(function(data) {
				if (data==undefined){
					console.log("no hit");
					this.changeState('outofservice');
					throw new Error("コードを終了");
				}
				/* 必ずdataの3要素がすべて合致する */
				/* nextpage fuc用に保存 */
				this.siteinfo = data;
				
				/* 同じsetNextPageで処理するために現在のdocumentを格納 */
				this.NextPgDocument = document;
				this.setInsertPoint();
				/* マウスの監視 */
				this.Observer = new IntersectionObserver(this.onscroll.bind(this), this.Observeroptions);
				/* ↓位置が重要 */
				this.changeState('on');
				/*if (!this.isSleipnir)this.saveHitData2GM();*/
				/* ここまで同期処理 */
			}.bind(this));
			/* ここから非同期処理 */
		},

		getSiteinfo: function(callback) {
			console.log("start");
			this.getCache(function(siteinfo) {
				siteinfo.unshift(this.Settings.LOCAL_SITEINFO, this.Settings.MICROFORMATS);
				console.log("start getCache :siteinfo after unshift",siteinfo);
				let data = [];
				for (let i = 0; i < siteinfo.length; i++) {
					for(let {data: j} of siteinfo[i]){
						if (j==undefined) {
							/* sleipnirでsiteinfo[i].lengthでjがundefinedとなるため */
							continue;
						}
						/*	console.log(j.url,
							"\n",RegExp(j.url).test(location.href),
							"\n",$x(j.nextLink, window.document, XPathResult.BOOLEAN_TYPE).booleanValue,
							"\n",$x(j.pageElement, window.document, XPathResult.BOOLEAN_TYPE).booleanValue,
							location.href);*/
						let ArrTxT=["url: ","nextLnk: ","Body: ","insB: "];
						let booleanArr=[];
						if (RegExp(j.url).test(location.href)){
							booleanArr.push(j.url);
							booleanArr.push($x(j.nextLink, window.document, XPathResult.BOOLEAN_TYPE).booleanValue);
							booleanArr.push($x(j.pageElement, window.document, XPathResult.BOOLEAN_TYPE).booleanValue);
							if(j.insertBefore!=""){
								booleanArr.push($x(j.insertBefore, window.document, XPathResult.BOOLEAN_TYPE).booleanValue);
							}else{
								booleanArr.push("empty");
							}
							if (booleanArr[1] && booleanArr[2]){
								/* Wedataを自分用にストック用のみ*/
								if(!this.isSleipnir){
									/* chromeのときの処理 */
									this.EvaluateSiteinfo(j);
								}
								data.push(j);
							/* 	for(let h=0; h<booleanArr.length; h++){
									this.ConsoleTxT = this.ConsoleTxT + ArrTxT[h] + booleanArr[h].toString() + h  +"\n";
								}
								console.log("hit","\n",this.ConsoleTxT);
								alert(this.ConsoleTxT); */
							}else{
								for(let h=0; h<booleanArr.length; h++) this.ConsoleTxT = this.ConsoleTxT + ArrTxT[h] + booleanArr[h].toString() +"\n";
							}
						}else{
							/* 処理なし */
						}
					}
					/* console.log(siteinfo[i]); */
				}
				console.log("xpathエラー","\n",this.ConsoleTxT,"\n");
				if (data.length>1){
					console.log("before",data);
					data = data.reduce(this.aryMax);
					console.log("after",data);
					callback(data);
				}else if(data.length=1){
					/* console.log("data.length 1",data); */
					callback(data[0]);
				}
			}.bind(this));
		},

		/* 追加分、最長一致 */
		aryMax : function (a, b) {
			let tempalength = a.url.replace(/[-+^:,)(?\\]/g, '').length;
			let tempblength = b.url.replace(/[-+^:,)(?\\]/g, '').length;
			/*console.log("                 ",a, b,a.url.replace(/[-+^:,)(?\\]/g, ''),b.url.replace(/[-+^:,)(?\\]/g, ''))*/
			if(tempalength < tempblength){
				return b;
			}else {
				return a;
			}
		},
		
		setInsertPoint: function() {
			/* 本文の要素を取得 */
			let elems = $x(this.siteinfo.pageElement, document, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
			console.log("pageelement",elems);
			/* idが重複していても最後の要素を取得できる */
			let MainContElem = elems.snapshotItem(elems.snapshotLength-1);
			console.log("--last of pageelements",MainContElem);
			/* insertBeforeの設定はWedataにほぼない。無視をしても大丈夫でも便利か。 */
			/* siteinfo.insertBeforeが設定されていないと↓はエラーになる
			console.log(typeof(this.siteinfo.insertBefore),this.siteinfo.insertBefore);*/
			if (typeof(this.siteinfo.insertBefore)=="undefined"||this.siteinfo.insertBefore==""||this.siteinfo.insertBefore==null){
				console.log("kottinikiteiru");
				this.insertPoint = MainContElem.nextElementSibling || MainContElem.parentNode.nextElementSibling;
				console.log("--nextElementSibling",MainContElem.nextElementSibling);
				console.log("--parentNode.nextElementSibling",MainContElem.parentNode.nextElementSibling);
				console.log("--insertBeforeなし、pageElementから作成");
				/* コンテナが文字列になってしまう
				MainContElem.append(this.InsertContainer);*/
				MainContElem.insertAdjacentHTML('beforeend', this.InsertContainer);
			}else{ /* siteinfo.insertBeforeが空じゃないとき */
				this.insertPoint = $x(this.siteinfo.insertBefore, document, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
				if (this.insertPoint==null){
					console.log("--insertBefore指定が誤り、pageElementから作成");
					MainContElem.lastChild.insertAdjacentHTML('beforeend', this.InsertContainer);
				}
				console.log("--insertBeforeあり",this.insertPoint);
				this.insertPoint.insertAdjacentHTML('beforebegin', this.InsertContainer);
					/* 上の方法のほうが簡単にできる
					this.tempinsertPointSeparator = document.createElement('div');
					this.tempinsertPointSeparator.id = 'insertPointSeparator';
					let text = document.createTextNode('Next insert here');
					this.tempinsertPointSeparator.appendChild(text);
					console.log("this.insertPoint",this.insertPoint);
					console.log("this.insertPoint.parentNode",this.insertPoint.parentNode);*/
			}
		},
		
		/* -----マウス移動処理------ */
		setNextPage: function() {
			/* "次へ"のリンクを取得 */
			let presentLink;
			if(this.pageCount==1){
				presentLink = $x(this.siteinfo.nextLink, document, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
				this.PageHeight = $x(this.siteinfo.pageElement, document, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue.scrollHeight;
				console.log("-2-次のリンク",this.pageCount,presentLink);

			}else{
				/* 最後のiframeからnextlinkを取得 */
				let NextPgDocuments = document.querySelectorAll(".insertiFrameclass");
				this.NextPgDocument = NextPgDocuments[NextPgDocuments.length-1];
				
				/* querySelectorAllの順番の確認、追加順になっている 
				let checktext="";
				for(i=0;i<NextPgDocuments.length;i++)checktext = checktext + "\n" + NextPgDocuments[i].id;*/
				
				/*iframeの内部については、namespaceが異なるため、$xが使えない。
				let pageElement = $x(this.siteinfo.pageElement, this.NextPgDocument, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;*/

				/* $xは、javascriptで↓のメソッドがある
				名前空間の取得
				const nsResolver = document.createNSResolver(
					this.NextPgDocument.ownerDocument === null
					? this.NextPgDocument.documentElement
					: this.NextPgDocument.ownerDocument.documentElement,
				); */

				/* iframeの要素は、名前空間の指定はしなくても良い。 */
				presentLink = document.evaluate(
					this.siteinfo.nextLink,
					this.NextPgDocument.contentDocument,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null,
				).singleNodeValue;

				let BodyScrollHeight;
				try{
					BodyScrollHeight = document.evaluate(
						this.siteinfo.pageElement,
						this.NextPgDocument.contentDocument,
						null,
						XPathResult.FIRST_ORDERED_NODE_TYPE,
						null,
					).singleNodeValue.scrollHeight;
				}catch(e){
					console.log("scrollHeight取得できず");
				}
				console.log("-2-次のリンク",this.pageCount,presentLink);
			}

			if (!presentLink) {
				this.changeState('finish');
				throw new Error("finish");
			}else{
				this.nextUrl = presentLink.href;
			}
			
			/* 古いセパレータ取得 */
			let insertPointSeparator = document.getElementById('insertPointSeparator');
			
			/* 新規のiframe作成 */
			let tempdiv = document.createElement('iframe');
			tempdiv.id = "insertiFrame"+this.pageCount;
			tempdiv.classList.add("insertiFrameclass");
			tempdiv.style.width = "100%";
			tempdiv.style.height = this.PageHeight +"px";
			tempdiv.style.overflow = "Hidden";
			tempdiv.src = this.nextUrl;
			tempdiv.onload = () => {/* iframeタグがhtmlに追加されて、外部htmlを読み込み終わった後に呼ばれる*/
				/*iframeで読み込んだhtmlのbodyをconsoleに表示 */
				/* let test = document.querySelector(this.siteinfo.pageElement).contentWindow.document.body.cloneNode(true).childNodes;*/
				
				/* セパレータの入れ替え */
				insertPointSeparator.insertAdjacentHTML('beforebegin', 
				`<div class="insertPointSeparator" style="z-index: 2147483645; width: 100%; left: 0%; margin-top:1em; visibility:visible; font-size:2em;"><a href=${this.nextUrl}>---Page: ${this.pageCount+1}---</a></div>`);
				insertPointSeparator.remove();
				/* 新しいinsertseparatorの追加 */
				this.setInsertPoint();
				/* observe */
				/*this.Observer.observe(document.getElementById('insertPointSeparator'));*/
				this.changeState('on');
				this.pageCount++;
			};
			insertPointSeparator.after(tempdiv);
		},

		getNextPage: function(nextUrl,callback){
			if(this.isSleipnir){
				callback(SLEX_httpGet(nextUrl));
			}else{
				GM_xmlhttpRequest({
					method: 'GET',
					url: nextUrl,
					responseType: 'document',
					onload: function(res) {
						let resp = res.responseText;
						callback(resp);
					},
				});
			}
		},

		/* WedataからのJSONをストックして、自分用のsiteinfo作成目的だったかな? */
		/* siteinfoが正しいかのチェック機能だった chromeのみ*/
		EvaluateSiteinfo: function(j){
			if (!GM_getValue('access')) GM_setValue('access', []);
			let tempJ = [{
				data :{
					'localhref'		:location.href,
					'url'			:j.url,
					'nextLink'		:$x(j.nextLink, window.document, XPathResult.BOOLEAN_TYPE).booleanValue,
					'pageElement'	:$x(j.pageElement, window.document, XPathResult.BOOLEAN_TYPE).booleanValue,
				},
			}];
			let accessData = GM_getValue('access');
			for (let i = 0; i < accessData.length; i++) {
				for(let {data: k} of accessData[i]){
					if (k.localhref == location.href){
						accessData.push(tempJ);
						console.log("accessData",accessData);
						GM_setValue('access', accessData);
						return;
					};
				};
			};
		},
		
		saveHitData2GM: function() {
			let tempdata = this.GM_getValue("accumalateData");
			console.log(JSON.parse(tempdata));
			if (tempdata!=undefined){
				let tempArr = JSON.parse(tempdata);
				tempArr.push(this.siteinfo);
				this.GM_setValue("accumalateData",JSON.stringify(tempArr));
			}else{
				this.GM_setValue("accumalateData",JSON.stringify(this.siteinfo));
			};
		},
		GM_getValue: function (key,def) {
			let iTems = window.localStorage.getItem(key);
			if (iTems){
				return JSON.parse('[' + iTems + ']');
			}else{
				return def;
			}
		},
		GM_setValue: function (key,value) {
			return window.localStorage.setItem(key, JSON.stringify(value));
		},
		
		clearCache: function() {
			alert("clearCache");
			this.GM_setValue('cache', []);
		},
		

		getCache:async function(callback) {
			/* localstrage設定されているか */
			let cache = this.GM_getValue('cache', []);
			console.log("this.GM_getValue",cache);
			cache.length>1 ? callback(cache): this.setCache(callback);
		},
		setCache:async function(callback) {
			console.log("get websiteinfo");
			if(!this.isSleipnir){
				this.accessCount+=1;
				/* chromeは通るが、sleipnirでエラー*/
				console.log("this.accessCount",this.accessCount);
			}
			let siteinfo = [];
			let url = this.Settings.siteinfo_urls[0];

			if (this.useWedata){
				if(this.isSleipnir){
					let tempsiteinfo = await SLEX_httpGet(url);
					if (tempsiteinfo){
						this.GM_setValue('cache', tempsiteinfo);
						siteinfo.push(JSON.parse(tempsiteinfo));
						callback(siteinfo);
					}else{
						callback([]);
					}
				}else{
					let returndata;
					await GM_xmlhttpRequest({
						method: 'GET',
						url: url,
						synchronous: true,
						responseType: 'blob',
						onload: function(res) {
							if (res.status == 406){
								/* 空の配列を返す */
								console.log("HTTP 406 Not Acceptable");
								callback([]);
							}
							let blob = res.response;
							let fr = new FileReader();
							fr.onload = function() {
								 /* console.log("httprequest loadstart",fr.result); */
								let parsedAr = JSON.parse(fr.result);
									siteinfo.push(parsedAr);
									this.GM_setValue('cache', parsedAr);
									returndata = siteinfo;
									callback(siteinfo);
									return;
							}.bind(this);
							fr.readAsText(blob);
						}.bind(this),
						onerror: function(res) {
							console.log("xmlhttpRequestエラー");
							callback([]);
						}.bind(this)
					});
				}
			}else{
				console.log("webdata使用しない");
				callback([]);
				return;
			}
		},

		onscroll: function(entries) {
			if (this.ObserverInit){
				this.ObserverInit = false;
				return;
			};
			let entry = entries[0];
			const currentY = entry.boundingClientRect.y;
			const currentRatio = entry.intersectionRatio;
			const isIntersecting = entry.isIntersecting;

			if (currentY < this.previousY) {
				if (currentRatio > this.previousRatio && isIntersecting) {
					this.changeState('loading');
					this.setNextPage();
				};
			}else if (currentY > this.previousY && isIntersecting) {
				if (currentRatio < this.previousRatio) {
				}else {
					this.changeState('loading');
					this.setNextPage();
				};
			};
			this.previousY = currentY;
			this.previousRatio = currentRatio;
		},

		ondblclick: function() {
			console.log("dff");
			this.changeState(this.state == 'off' ? 'on': 'off');
		},

		changeState: function(state) {
			this.state = state;
			this.icon.style.backgroundColor = this.Settings.color[state];
			switch (state) {
				case 'off':
					this.icon.textContent = 'off';
					this.icon.style.textAlign = 'center';
					this.icon.style.fontSize = '13pt';
					this.Observer.unobserve(document.getElementById('insertPointSeparator'));
					break;
				case 'on':
					this.icon.textContent = 'on';
					this.icon.style.textAlign = 'center';
					this.icon.style.fontSize = '14pt';
					this.Observer.observe(document.getElementById('insertPointSeparator'));
					break;
				case 'timeout':
					this.icon.textContent = 'T.O.';
					this.icon.style.fontSize = '8pt';
					this.icon.style.textAlign = 'center';
					setTimeout(this.changeState, 1000, 'on');
					break;
				case 'finish':
					this.icon.textContent = 'fin.';
					this.icon.style.fontSize = '8pt';
					this.icon.style.textAlign = 'center';
					this.Observer.unobserve(document.getElementById('insertPointSeparator'));
					break;
				case 'error':
					this.icon.textContent = 'error';
					this.icon.style.fontSize = '8pt';
					this.icon.style.textAlign = 'center';
					this.Observer.unobserve(document.getElementById('insertPointSeparator'));
					break;
				case 'outofservice':
					this.icon.textContent = 'n.d.';
					this.icon.style.fontSize = '6pt';
					this.icon.style.textAlign = 'left';
					break;
				case 'loading':
					this.icon.textContent = 'load';
					this.icon.style.fontSize = '8pt';
					this.icon.style.textAlign = 'center';
					this.Observer.unobserve(document.getElementById('insertPointSeparator'));
					break;
			};
		},

		addIcon: function() {
			this.icon = document.body.appendChild(document.createElement('div'));
			this.icon.id = 'autopagerize_icon';
			this.icon.style.bottom = '10px';
			this.icon.style.left = '10px';
			this.icon.style.width = '25px';
			this.icon.style.height = '25px';
			this.icon.style.opacity = 0.7;
			this.icon.style.position = 'fixed';
			this.icon.style.zIndex = '9999';
			this.icon.style.backgroundColor = 'gray';
		},
		
		isHoldDown: function(targetElement, thresholdMsec = 1000) {
			return new Promise((resolve) => {
				const timerId = setTimeout(() => {
					resolve(true);
					removeListener();
				}, thresholdMsec);
				const touchendHandler = () => {
					resolve(false);
					removeListener();
				};
				const contextHandler = (event) => {
					event.preventDefault();
				};
				const beforeTargetStyle = targetElement.style.userSelect;
				const removeListener = () => {
					clearTimeout(timerId);
					targetElement.removeEventListener('touchend', touchendHandler);
					targetElement.removeEventListener('contextmenu', contextHandler);
					targetElement.style.userSelect = beforeTargetStyle;
				};
				targetElement.addEventListener('touchend', touchendHandler);
				/* 右クリックを無効化 */
				targetElement.removeEventListener('contextmenu', contextHandler);
				/* //↓無効化されない
				targetElement.oncontextmenu = function () {return false;}; */
				/* text選択の無効化 */
				targetElement.style.userSelect = 'none';
			});
		},
		/* 呼び出し */
		TapEvent: async function(event,elem) {
			if (await this.isHoldDown(event.target)) {
				this.clearCache();
				console.log('ロングタップ');
			} else {
				console.log('普通のタップ');
				this.ondblclick();
			}
		},
	};
	
	/*new AutomateMobilePage();*/
	let AutoPage = new AutomateMobilePage();
	try{
		AutoPage.initialize();
	}catch(e){
		console.log(e.message);
	}

	function $x(exp, context, type) {
		let result = ((context.ownerDocument || context).createExpression(exp, function(context) {
		document.createNSResolver((context.ownerDocument || context).documentElement).lookupNamespaceURI(context.prefix)
		|| context.documentElement.namespaceURI})).evaluate(context, type, null);
		return result;
	}

})();
