mui.plusReady(function() {
	var mynum=0;
	var vm = new Vue({
		el: '#app',
		data: {
			banner: '',
			slide: '',
			goodsInfo: [],
			color: '',
			pic: '',
			shopInfo: '',
			recommend: '',
			totalList: [],
			totalNum: 0,
			totalPrice: 0,
			index: 0,
			size: '',
			isme:'',
			mycolor:'',
		},
		mounted: function() {
			mui('body').on('tap', 'a[sart]', function() {
				if(!plus.storage.getItem('token')) {
					mui.openWindow('login.html', 'login.htm', {
						styles: {
							popGesture: "none",
							animationOptimization: 'fade-in',
							background:'#FFFFFF',
						},
					});
					return;
				}
				var href = this.getAttribute('href');
				var id = this.getAttribute("data-wid") || href;
				if(id.indexOf("?") != -1) id = id.split("?")[0];
				if(href && ~href.indexOf('.html')) mui.openWindow(href, id, {
					styles: {
						popGesture: "close"
					},
				});
			});
			mui('.mui-scroll-wrapper').scroll({
				deceleration: 0.0005 //flick 减速系数，系数越大，滚动速度越慢，滚动距离越小，默认值0.0006
			});
		},
		methods: {
			toggleGoods: function(i, id, collect) { //收藏切换
				var url = collect == 1 ? "/collectGoods" : '/delCollectGoods';
				yh.ajax({
					url: url,
					data: {
						'goodsid': id,
					},
					type: "post",
					fn: function(data) {
						vm.recommend[i].collect = collect == 1 ? 2 : 1;
					}
				}, true);
			},
			follow: function() { //关注
				yh.ajax({
					url: '/followShop',
					data: {
						'shopid': vm.shopInfo.id,
					},
					type: "post",
					fn: function(data) {
						vm.shopInfo.count++;
						vm.shopInfo.follow = 2;
						mui.toast('关注成功');
					}
				}, true);
			},
			sider: function(index) { //颜色切换
				if(index == vm.index) return;
				for(var j = 0; j < vm.color.length; j++) {
					if(j == index) vm.color[j].active = 1;
					else vm.color[j].active = 0;
				};
				var size = vm.size,
					i = 0,
					len = size.length;
				for(; i < len; i++) {
					var list = vm.totalList,
						j = 0,
						l = list.length,
						on = true;
					for(; j < l; j++) {
						if(vm.color[index].color == list[j].color && size[i].size == list[j].size) {
							size[i].num = list[j].num;
							on = false;
						}
					}
					if(on) size[i].num = 0;
				}
				vm.index = index;
				vm.mycolor=vm.color[index].color;
			},
			addAndSubtract: function(item, n) { //数量加减
				if(!/^[0-9]*$/.test(item.num))item.num=0;
				if(!n&&item.num==''||n < 0 && item.num == 0) {
					vm.total();
					return;
				}
				item.num = n ? parseInt(item.num) + n : parseInt(item.num);
				var value = {
					'color': vm.color[vm.index].color,
					'size': item.size,
					'num': item.num
				};
				if(vm.totalList.length > 0) {
					var s = true;
					for(var j = 0; j < vm.totalList.length; j++) {
						if(vm.totalList[j].color == vm.color[vm.index].color && vm.totalList[j].size == item.size) {
							value.num == 0 ? vm.totalList.splice(j, 1) : vm.totalList[j] = value;
							s = false;
						}
					}
					if(s) vm.totalList.push(value);
				} else vm.totalList.push(value);
				vm.total();
			},
			isNum: function(item,i) {
				var num = item.num;
				vm.size[i].num=num < 0 || !num ? 0 : Number(num);
				var j=0;
				for (;j<vm.totalList.length;j++) {
					if(vm.totalList[j].size==vm.size[i].size&&vm.mycolor==vm.totalList[j].color){
						vm.totalList[j].num=vm.size[i].num;
					}
				}
				vm.total();
			},
			end: function(e) {//移动光标到结尾
				var obj = e.srcElement;
				var len = obj.value.length;
				obj.focus();
				if(document.selection) {
					setTimeout(function() {
						var sel = obj.createTextRange();
						sel.moveStart('character', -1);
						sel.collapse();
						sel.select();
					}, 100);
				} else if(typeof obj.selectionStart === 'number' && typeof obj.selectionEnd === 'number') {
					setTimeout(function() {
						obj.selectionStart = obj.selectionEnd = len;
					}, 100);
				}
			},
			total: function() { //价格计算
				mynum++;
				var list = vm.totalList,
					i = 0,
					len = list.length,
					price = vm.goodsInfo.price;
				var totalNum = 0,
					totalPrice = 0;
				for(; i < len; i++) {
					if(list[i].num!=""){
						totalPrice += list[i].num * price;
						totalNum += list[i].num;
					}
					
				}
				totalPrice = this.toDecimal2(totalPrice);
				vm.totalPrice = totalPrice ? totalPrice : 0;
				vm.totalNum = totalNum ? totalNum : 0;
			},
			toDecimal2: function(x) { //保留两位小数  不四舍五入
				var f = parseFloat(x);
				if(isNaN(f)) {
					return false;
				}
				var f = Math.round(x * 100) / 100;
				var s = f.toString();
				var rs = s.indexOf('.');
				if(rs < 0) {
					rs = s.length;
					s += '.';
				}
				while(s.length <= rs + 2) {
					s += '0';
				}
				return s;
			},
			godetails: function(id) {
				mui('.mui-scroll-wrapper').scroll().scrollTo(0,0,100);
				vm.size=[];
				vm.totalNum=0;
				vm.totalPrice=0;
				vm.totalList=[];
				vm.index=0,
				vm.goodsInfo= []
				pullrefresh(id);
			},
			push: function() {
				if(vm.totalList.length == 0) {
					mui.toast("你还没有选择颜色和尺码");
					return;
				};
				yh.istoken(function(){
					yh.ajax({
						url: '/addCar',
						data: {
							goodsid: vm.goodsInfo.id,
							info: vm.totalList,
						},
						type: "post",
						fn: function(data) {
							mui.toast("添加成功");
						}
					}, true);
				})
			},
			send: function() {
				if(this.isme==1){
					mui.toast("不能购买自己的商品哦！");
					return;
				}
				if(vm.totalList.length == 0) {
					mui.toast('请先选择颜色和尺寸');
					return;
				}
				var list = [{
					goodsid: vm.goodsInfo.id,
					spec: vm.totalList,
				}];
				plus.storage.setItem('list', JSON.stringify(list))
				yh.istoken(function(){
					mui.openWindow({
						url: 'order_details.html?name=details',
						id: 'order_details.html',
						styles: {
							top: 0,
							bottom: 0,
							background:'#FFFFFF',
						},
					});
				})
			},
			sendmessage: function(uid) { //聊天
				yh.istoken(function(){
					mui.openWindow({
						url: '../chat/html/message.html?id=' + uid,
						id: 'messige.html',
						styles: {
							top: 0,
							bottom: 0,
							background:'#FFFFFF',
						},
					})
				})
			},
			messagelist: function() {
				yh.messagelist();
			},
			goshopInfo: function() {
				var url = 'shopindex.html?id=' + this.shopInfo.id;
				mui.openWindow(url, 'shopindex.html', {
					styles: {
						popGesture: "close",
						background:'#FFFFFF',
					},
				});
			},
		},
		watch: {
			pic: function() {
				this.$nextTick(function() {
					vm.banner == '' ? vm.banner = new Swiper(".banner", {
						pagination: {
							el: '.swiper-pagination',
							bulletElement: 'div',
						},
						loopAdditionalSlides: 1, //启动自动切换 前后各加一张图片
						autoplay: {
							delay: 5000, //5秒切换一次
							disableOnInteraction: false, //开启用户点击后自动启动
						},
						observer: true, //修改swiper自己或子元素时，自动初始化swiper 
						observeParents: false, //修改swiper的父元素时，自动初始化swiper
					}) : "";
				})
			},
			color: function() {
				this.$nextTick(function() {
					vm.slide == '' ? vm.slide = new Swiper('.details-slide', {
						slidesPerView: 5,
						navigation: {
							nextEl: '.swiper-button-next',
						},
						observer: true, //修改swiper自己或子元素时，自动初始化swiper 
						observeParents: false, //修改swiper的父元素时，自动初始化swiper
					}) : vm.slide.update();
				})
			}
		}
	})
	pullrefresh();

	function pullrefresh(id) {
		var goodsid = id ? id : yh.getQueryString('id');
		yh.ajax({
			url: '/goods',
			data: {
				'goodsid': goodsid,
			},
			type: "get",
			fn: function(data) {
				vm.goodsInfo.id = data.id;
				vm.goodsInfo.title = data.title;
				vm.goodsInfo.goodsno = data.goodsno;
				vm.goodsInfo.price = data.price;
				vm.pic = data.goodsPic;
				vm.color = data.color;
				vm.mycolor=data.color[0].color;
				vm.shopInfo = data.shopInfo;
				vm.recommend = data.recommend;
				vm.size = data.size;
				vm.isme = data.isme;
			}
		});
	}
});