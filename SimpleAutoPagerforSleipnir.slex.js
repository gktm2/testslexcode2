// ==UserScript==
// @name Simple AutomateMobilePager for Sleipnir
// @author shyntom
// @description autopager for sleipnir
// @include http://*
// @include https://*
// @require jquery
// @require api-notification
// @require api
// @grant GM_xmlhttpRequest
// @grant GM_getValue
// @grant GM_setValue
// @version 2.02
// @history:ja      1.0.1 siteinfo_url GM_XMLhttprequestが非同期動作。callbackの関係でforeach使用できず。削除。
// @history:ja      1.0.2 id指定の場合も正常位置に挿入できるようになった。appendPointのままにしただけ
// @history:ja      1.0.3 最後のページが読み込まれていなかったのを修正。
// @history:ja      1.0.4 Trigerの仕方を改善
// @history:ja      1.0.5 読み込みまちで更に、trigerするとfreezeするのを回避。changestateを変更
// @history:ja      1.0.7 siteinfo読み込み周りのバグfix。url間違い、ファイル移動のerrorhandling、setcache,getcache周りの修正
// @history:ja      1.0.8 localhostに変更.localsiteinfo更新　for json　の変更点を移行
// @history:ja      2.00 名称変更。sconsole.log追加。最初の1回しか読み込まないように変更（localStorage使用）
// @history:ja      2.01 1回のみ実行のlocalStorage削除。url一致での排除へ。
// @history:ja      2.02 sconsole改良、getnextpage多重回避

// ==/UserScript==

(async function() {
	if(top !== self) return;

	function AutomateMobilePage(){  };

	AutomateMobilePage.prototype = {
		Settings: {
			siteinfo_urls: ['http://wedata.net/databases/AutoPagerize/items_all.json'],
			AUTO_START: true,
			REMAIN_HEIGHT: 100,
			Checkdata: true,
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
				name:'narou mobile 本文',
				data:{
					pageElement: 'id("novel_contents")',
					nextLink: '(//a[@class="novelview_pager-next"])[last()]',
					insertBefore:'(//div[@class="novel_bn" or @class="novel_bn footer"])[last()]/following::div',
					url: '^https?://ncode\.syosetu\.com/[0-9a-z]{7}/[0-9]{1,4}/$',
				},
			},
			{
				name:'narou mobile 感想回ごと',
				data:{
					pageElement: 'id("novel_contents")|id("contents_main")',
					nextLink: '//a[contains(text(), "Next") and contains(text(), ">>")][1]',
					url: '^https?://novelcom\.syosetu\.com/impression/list/ncode/[0-9]{4,8}/no/[0-9]{1,4}/$',
					insertBefore:'(//div[@class="page_bar"])[last()]/following::div',
					exampleurl: "https://novelcom.syosetu.com/impression/list/ncode/755380/no/139/"
				},
			},
			{
				name:'narou mobile 感想全体',
				data:{
					pageElement: 'id("novel_contents")|id("contents_main")',
					nextLink: '//a[contains(text(), "Next") and contains(text(), ">>")][1]',
					url: '^https?://novelcom\.syosetu\.com/impression/list/ncode/[0-9]{4,8}/$',
					exampleurl: "https://novelcom.syosetu.com/impression/list/ncode/755380/no/139/"
				},
			},
			{
				name:'narou お気に入りリスト',
				data:{
					pageElement: 'id("contents")/form',
					nextLink: '//a[contains(text(), "Next") and contains(text(), ">>")][1]',
					url: '^https?://syosetu.com/favnovelmain/list/',
					exampleurl: 'https://syosetu.com/favnovelmain/list/'
				},
			},
			{
				name:'narou 各話リスト',
				data:{
					pageElement: '//div[@id = "novel_color"]',
					nextLink: '//div[@class = "novelview_pager-next"]',
					url: '^https?://ncode.syosetu.com/[0-9a-z]{7,}/',
					exampleurl: 'https://ncode.syosetu.com/n3930eh/'
				},
			},
			{
				name:'newpuru.doorblog.jp/',
				data:{
					pageElement: '//div[@class = "content"]',
					nextLink: '(//li[@class = "pager-next box-border"])/a',
					url: '^http://newpuru.doorblog.jp/',
					insertBefore:'',
				},
			},
			{
				name:'kanasoku.s130',
				data:{
					pageElement: '//div[@id = "content"]',
					nextLink: '//a[@class = "square_btn"]',
					url: '^http://kanasoku.s130.coreserver.jp/',
				},
			},
			{
				name:'toua sokuhou',
				memo:'javascriptでページを組み直している。このためcss適応ができない',
				data:{
					pageElement: '//div[@class = "ui-content" or @id="main"]',
					nextLink: '//a[@class = "next ui-btn ui-btn-up-a"]',
					insertBefore:'(//ul[@class="ui-listview"])[last()]/following::*',
					url: '^http://news.antenam.biz/',
				},
			},
			{
				name:'2channneler',
				memo:'最初のdodumentにはcontentなし',
				data:{
					pageElement: '//div[@class = "ui-content"]',
					nextLink: '(//a[@class="ui-btn"])',
					url: '^https://2channeler.com/sp/',
				},
			},

			
			
			{
				resource_url: "http://wedata.net/items/85199",
				name: "ｋ本的に無料ソフト・フリーソフト　各ソフトウェア紹介ページ",
				memo: ["css selectorとxpathは別物です",
						'//a[@class="novelview_pager-next"][position()=2]連続したaではないのでだめ',
						'//\*[last()]/self::a[@class="novelview_pager-next"]だめ',
						'(//a[@class="novelview_pager-next"])[last()];OK'],
				data: {
				url: "^https?://(?:www\\.)?gigafree\\.net/.+",
				pageElement: "id(\"main\")//div[contains(concat(\" \", normalize-space(@class), \" \"), \" detail \")]",
				exampleUrl: "https://www.gigafree.net/media/music/aimp.html",
				insertBefore: "id(\"main\")//div[contains(concat(\" \", normalize-space(@class), \" \"), \" article_bottom \")]",
				nextLink: "id(\"main\")//div[contains(concat(\" \", normalize-space(@class), \" \"), \" pagination \")]/a[contains(text(), \"次のページへ進む\")]"
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
		useWedata: false,
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
		InsertContainer: `<div id="insertPointSeparator" style="z-index: 2147483645; width: 100%; left: 0%;">--Next insert here--</div>`,
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

		initialize: function() {
			/* プラットフォームをチェック */
			this.isSleipnir = 'undefined' != typeof SLEX_locale;
			console.log(document);
			/* アイコンを追加 */
			this.addIcon();
			document.getElementById('autopagerize_icon').addEventListener('click', this.ondblclick.bind(this), false);
			/* 処理を開始 */
			this.getSiteinfo(function(data) {
				if (data==undefined){
					console.log("no hit");
					this.changeState('outofservice');
					return;
				};
				/* 必ずdataの3要素がすべて合致する */
				/* nextpage fuc用に保存 */
				this.siteinfo = data;
			}.bind(this));
			/* 同じsetNextPageで処理するために現在のdocumentを格納 */
			this.NextPgDocument = document;

			this.setInsertPoint();

			this.Observer = new IntersectionObserver(this.onscroll.bind(this), this.Observeroptions);
			/* ↓位置が重要 */
			this.changeState('on');
			if (!this.isSleipnir)this.saveHitData2GM();
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
		setInsertPoint: function() {
			/* 本文の要素を取得 */
			var elems = $x(this.siteinfo.pageElement, document, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
			/* idが重複していても最後の要素を取得できる */
			let MainContElem = elems.snapshotItem(elems.snapshotLength-1);
			console.log(MainContElem);
			
			/* insertBeforeの設定はWedataにほぼない。無視をしても大丈夫でも便利か。 */
			console.log(typeof(this.siteinfo.insertBefore));
			if (typeof(this.siteinfo.insertBefore)=="undefined"||this.siteinfo.insertBefore==""){
				this.insertPoint = MainContElem.nextElementSibling || MainContElem.parentNode.nextElementSibling;
				console.log("1",this.insertPoint);
			}else{
				this.insertPoint = $x(this.siteinfo.insertBefore, document, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
				console.log("2",this.insertPoint);
			};
			
			console.log("this.insertPoint",this.insertPoint);
			/*Insert用のdivコンテナを作成*/
			this.insertPoint.insertAdjacentHTML('beforebegin', this.InsertContainer);
					/* 上の方法のほうが簡単にできる
					this.tempinsertPointSeparator = document.createElement('div');
					this.tempinsertPointSeparator.id = 'insertPointSeparator';
					var text = document.createTextNode('Next insert here');
					this.tempinsertPointSeparator.appendChild(text);
					console.log("this.insertPoint",this.insertPoint);
					console.log("this.insertPoint.parentNode",this.insertPoint.parentNode);*/
		},

		setNextPage: function() {
			/* "次へ"のリンクを取得 */
			var presentLink = $x(this.siteinfo.nextLink, document, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
			if (!presentLink) {
				this.changeState('finish');
				/* observerを終了させるべきか？ */
				return;
			}else{
				this.nextUrl = presentLink.href;
			};
			this.getNextPage(this.nextUrl,function(gPressult){
				console.log(this.nextUrl);
				/* gPressultはテキストデータ */
				if (!gPressult) return;
				var parsedObj = null;
				var doc = new DOMParser();
				parsedObj = doc.parseFromString(gPressult, 'text/html');
				if (parsedObj.getElementsByTagName("parsererror").length) {
					parsedObj = null;
					return;
				};
				this.NextPgDocument = parsedObj;
				console.log(parsedObj);
				var pageElement = $x(this.siteinfo.pageElement, this.NextPgDocument, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
				console.log("pageElement",pageElement);
				/* 古いセパレータ取得 */
				let insertPointSeparator = document.getElementById('insertPointSeparator');
				/* pageElementを挿入 */
				insertPointSeparator.parentNode.insertBefore(pageElement, insertPointSeparator.nextElementSibling);
				/* セパレータの入れ替え */
				insertPointSeparator.insertAdjacentHTML('beforebegin', 
				`<div class="insertPointSeparator" style="z-index: 2147483645; width: 100%; left: 0%; margin-top:1em; visibility:visible;"><a href=${this.nextUrl}>---Page: ${this.pageCount}---</a></div>`);
				insertPointSeparator.remove();
				/* 新しいinsertseparatorの追加 */
				this.setInsertPoint();
				/* observe */
				/*this.Observer.observe(document.getElementById('insertPointSeparator'));*/
				this.changeState('on');
				this.pageCount++;
			}.bind(this));
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
						var resp = res.responseText;
						callback(resp);
					},
				});
			};
		},

		getSiteinfo: function(callback) {
			this.getCache(function(siteinfo) {
				siteinfo.unshift(this.Settings.LOCAL_SITEINFO, this.Settings.MICROFORMATS);
				var data = [];
				for (var i = 0; i < siteinfo.length; i++) {
					for(var {data: j} of siteinfo[i]){
						if (this.Settings.Checkdata){
							console.log(j.url,
							"\n",RegExp(j.url).test(location.href),
							"\n",$x(j.nextLink, window.document, XPathResult.BOOLEAN_TYPE).booleanValue,
							"\n",$x(j.pageElement, window.document, XPathResult.BOOLEAN_TYPE).booleanValue,
							location.href);
						};
						if (RegExp(j.url).test(location.href) &&
						$x(j.nextLink, window.document, XPathResult.BOOLEAN_TYPE).booleanValue &&
						$x(j.pageElement, window.document, XPathResult.BOOLEAN_TYPE).booleanValue) {
							if(!this.isSleipnir){
								/* chromeのときの処理 */
								this.EvaluateSiteinfo(j);
							};
							data.push(j);
						};
					};
				};
				if (data.length >1){
					console.log("before",data);
					data = data.reduce(this.aryMax);
					console.log("after",data);
					callback(data);
				}else if(data.length <=1){
					console.log("data.length 1以下",data);
					callback(data[0]);
				};
			}.bind(this));
		},

		/* 追加分、処理の意図がわからん */
		aryMax : function (a, b) {
			let tempalength = a.url.replace(/[-+^:,)(?\\]/g, '').length;
			let tempblength = b.url.replace(/[-+^:,)(?\\]/g, '').length;
			/*console.log("                 ",a, b,a.url.replace(/[-+^:,)(?\\]/g, ''),b.url.replace(/[-+^:,)(?\\]/g, ''))*/
			if(tempalength < tempblength){
				return b;
			}else {
				return a;
			};
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
				for(var {data: k} of accessData[i]){
					if (k.localhref == location.href){
						accessData.push(tempJ);
						console.log("accessData",accessData);
						GM_setValue('access', accessData);
						return;
					};
				};
			};
		},

		GM_getValue: function (key,def) {
			let iTems = window.localStorage.getItem(key);
			if (iTems){
				return JSON.parse('[' + iTems + ']');
			}else{
				return def ;
			};
		},
		GM_setValue: function (key,value) {
			console.log(key,def);
			return window.localStorage.setItem(key, JSON.stringify(value));
		},

		getCache: function(callback) {
			/* localstrage設定されているか */
			var cache = this.GM_getValue('cache', []);
			cache.length ? callback(cache): this.setCache(callback);
		},
		setCache: function(callback) {
			if(this.isSleipnir){
				this.accessCount+=1;
				/* chromeは通るが、sleipnirでエラー
				console.log(accessCount);*/
			};
			var siteinfo = [];
			var url = this.Settings.siteinfo_urls[0];
			if (this.Settings.useWedata){
				if(this.isSleipnir){
					let tempsiteinfo = SLEX_httpGet(url);
					if (tempsiteinfo){
						this.GM_setValue('cache', tempsiteinfo);
						siteinfo.push(JSON.parse(tempsiteinfo));
						callback(siteinfo);
					}else{
						callback([]);
					};
				}else{
					GM_xmlhttpRequest({
						method: 'GET',
						url: url,
						responseType: 'blob',
						onload: function(res) {
							if (res.status == 406){
								callback([]);
								return;
							};
							var blob = res.response;
							var fr = new FileReader();
							fr.onload = function() {
							let parsedAr = JSON.parse(fr.result);
								siteinfo.push(parsedAr);
								this.GM_setValue('cache', parsedAr);
								callback(siteinfo);
								return;
							}.bind(this);
							fr.readAsText(blob);
						}.bind(this),
						onerror: function(res) {
							callback([]);
						},
					});
				};
			}else{
				callback([]);
			};
		},

		onscroll: function(entries) {
			if (this.ObserverInit){
				this.ObserverInit = false;
				return;
			};
			var entry = entries[0];
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
	};
	
	/*new AutomateMobilePage();*/
	await new Promise(resolve => setTimeout(resolve, 3000));
	let AutoPage = new AutomateMobilePage();
	AutoPage.initialize();

	function $x(exp, context, type) {
		var result = ((context.ownerDocument || context).createExpression(exp, function(context) {
 document.createNSResolver((context.ownerDocument || context).documentElement).lookupNamespaceURI(context.prefix)
 || context.documentElement.namespaceURI})).evaluate(context, type, null);
		return result;
	};

})();
