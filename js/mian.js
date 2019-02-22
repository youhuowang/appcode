mui.plusReady(function() {
	window.addEventListener('refresh', function(e) {
		vm.address = plus.storage.getItem('address');
		vm.marketid = plus.storage.getItem('county') || '',
			vm.page = 0;
		vm.banner = '';
		vm.notice = null;
		vm.shop = '';
		vm.shopstatus = '';
		pulldownRefresh();
		pullupRefresh();
	});
	plus.navigator.setStatusBarBackground('#FFFFFF');
	plus.navigator.setStatusBarStyle('dark');
	var clickNum = 0;
	mui.back = function(event) {
		clickNum++;
		clickNum > 1 ? plus.runtime.quit() : mui.toast("再按一次退出应用");
		setTimeout(function() {
			clickNum = 0
		}, 2000);
		return false;
	}
	var vm = new Vue({
		el: '#app',
		data: {
			marketid: plus.storage.getItem('county') || '',
			address: plus.storage.getItem('address') || '',
			token: plus.storage.getItem('token') || false,
			istop: true,
			page: 0,
			mySwiper: '',
			shopid: '',
			noticeSwiper: '',
			shopSwiper: '',
			banner: '',
			notice: '',
			activity: '',
			shop: '',
			shoplist: [],
			shopstatus: '',
		},
		mounted: function() {
			mui('body').on('tap', 'a[tag]', function() {
				vm.openWindow(this);
			});
			mui('body').on('tap', 'a[token]', function() {
				!plus.storage.getItem('token') ? vm.log() : vm.openWindow(this);
				return;
			});
		},
		methods: {
			openWindow: function(e) {
				var href = e.getAttribute('href');
				var id = e.getAttribute("data-wid") || href;
				if(id.indexOf("?") != -1) id = id.split("?")[0];
//				if(id=='module/shopindex.html'&&plus.webview.getWebviewById('module/shopindex.html')){
//					plus.webview.getWebviewById('module/shopindex.html').close();
//				}
				if(href && ~href.indexOf('.html')) mui.openWindow(href, id, {
					styles: {
						popGesture: "close",
						background: '#FFFFFF',
					},
					createNew:true,
				});
			},
			log: function() {
				mui.openWindow('module/login.html', 'login.htm', {
					styles: {
						popGesture: "none",
						animationOptimization: 'fade-in',
						background: '#FFFFFF',
					},
				});
			},
			newWebview: function(i, id) {
				var hrefList = ['new_file.html', 'newPattern.html', 'trend.html', 'optimization.html'],
					href = hrefList[i];
				mui.openWindow('module/' + href + '?id=' + id, href, {
					styles: {
						popGesture: "none",
						animationOptimization: 'fade-in',
						background: '#FFFFFF',
					},
				});
			},
		},
		watch: {
			banner: function() {
				this.$nextTick(function() {
					vm.mySwiper == '' ? vm.mySwiper = new Swiper(".banner", {
						pagination: {
							el: '.swiper-pagination',
							bulletElement: 'div',
						},
						loop: true, //启动自动切换
						loopAdditionalSlides: 1, //启动自动切换 前后各加一张图片
						autoplay: {
							delay: 5000, //5秒切换一次
							disableOnInteraction: false, //开启用户点击后自动启动
						},

					}) : vm.mySwiper.update();
				})

			},
			notice: function() {
				this.$nextTick(function() {
					vm.noticeSwiper == '' ? vm.noticeSwiper = new Swiper('#notice', { //滚动通知
						direction: 'vertical',
						loop: true, //启动自动切换
						loopAdditionalSlides: 1, //启动自动切换 前后各加一条
						autoplay: {
							delay: 3000,
						},
						noSwiping: true, //禁用滑动
						noSwipingClass: 'swiper-slide',
					}) : vm.noticeSwiper.update();
				})
			},
			shop: function() {
				this.$nextTick(function() {
					vm.shopSwiper == '' ? vm.shopSwiper = new Swiper(".shop-swiper", {
						pagination: {
							el: '.swiper-pagination',
							bulletElement: 'div',
						},
						loop: true, //启动自动切换
						loopAdditionalSlides: 1, //启动自动切换 前后各加一张图片
						autoplay: {
							delay: 5000, //5秒切换一次
							disableOnInteraction: false, //开启用户点击后自动启动
						},
					}) : vm.shopSwiper.update();
				})
			},
		}
	});
	mui.init({ //下拉刷新   上拉加载
		pullRefresh: {
			container: '#pullrefresh',
			down: {
				style: 'circle',
				callback: pulldownRefresh,
				auto: false,
			},
			up: {
				contentrefresh: '正在加载...',
				auto: false,
				callback: pullupRefresh,
			}
		}
	});
	function pullupRefresh() {
		if(vm.address == "") return false;
		setTimeout(function() {
			vm.page++;
			yh.ajax({
				url: "/shopList",
				data: {
					city: vm.address,
					marketid: vm.marketid,
					page: vm.page,
					num: 15,
				},
				type: "get",
				fn: function(data) {
					if(vm.page==1)vm.shoplist = [];
					data.forEach(function(value, i) {　
						vm.shoplist.push(value);
					})
					mui('#pullrefresh').pullRefresh().disablePullupToRefresh(data.length < 15);
				}
			})
		}, 100);
	}

	function pulldownRefresh() {
		if(vm.page != 0) {
			vm.page = 0;
			vm.shoplist = [];
			mui('#pullrefresh').pullRefresh().refresh(true);
			pullupRefresh();
		}
		yh.ajax({
			url: "/indexData",
			data: {
				city: vm.address,
				marketid: vm.marketid,
			},
			type: "get",
			fn: function(data) {
				vm.shopid = data.shopid;
				vm.banner = data.banner;
				vm.notice = data.notice;
				vm.activity = data.activity;
				vm.shop = data.shop;
				vm.shopstatus = data.shopstatus || '';
				mui('#pullrefresh').pullRefresh().endPulldown();
			}
		});
	}
	plus.geolocation.getCurrentPosition(function(position) {
		if(position.address && plus.storage.getItem('add') != position.address.city) {
			plus.storage.setItem('add', position.address.city);
			if(vm.address != ''){
				mui.confirm('检测到你位置发生了变化,是否切换到当前城市?', '提示', ['否','是'], function(e) {
					if(e.index == 1) { //确认
						vm.address = '';
						getlist(position.address.city);
					}else{
						getlist(position.address.city);
					}
				})
			}else{
				getlist(position.address.city);
			}
		}else{
			getlist();
		}
	},getlist,{provider:'amap'});
	function getlist(add) {
		if(vm.address == '' && add) {
			plus.storage.setItem('address', add);
			vm.address = add;
		}
		if(vm.address != '') {
			pulldownRefresh();
			pullupRefresh();
		} else {
			mui.openWindow({
				url: '_www/module/Location.html',
				id: 'Location.html',
				styles: {
					top: 0,
					bottom: 0,
					background: '#FFFFFF',
				},
			})
		}
	}
})