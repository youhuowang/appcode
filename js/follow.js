mui.plusReady(function() {
	var clickNum=0;
	mui.back = function(event) {
		clickNum++;
		clickNum > 1?plus.runtime.quit():mui.toast("再按一次退出应用");
		setTimeout(function() {
			clickNum = 0
		}, 2000);
		return false;
	};
	var vm = new Vue({
		el: '#app',
		data: {
			onOff: false,
			page: 0,
			data:[],
			keyword:'',
		},
		methods: {
			followSearch:function(){
				if(vm.keyword=='')return;
				vm.page=0;
				vm.data=[];
				mui('#pullRefresh').pullRefresh().disablePullupToRefresh();
				yh.ajax({
					url: "/followSearch",
					data: {
						keyword: vm.keyword,
						type: 1,
					},
					type: "GET",
					fn: function(data) {
						for(var i = 0; i < data.length; i++) {
							data[i].follow=2;
							vm.data.push(data[i]);
						}
						vm.onOff=true;
					}
				})
			},
			upsech:function(){
				pulldownRefresh();
			},
			delFollowShop: function(item) { //关注切换
				var url = item.follow == 1 ? '/followShop' : '/delFollowShop';
				yh.ajax({
					url: url,
					data: {
						'shopid': item.id,
					},
					type: "post",
					fn: function(data) {
						item.follow=item.follow==1?2:1;
						mui.toast('操作成功');
					}
				}, true);
			},
			goshopindex: function(id) {
				mui.openWindow({
					url: 'shopindex.html?id=' + id,
					id: 'shopindex',
					styles: {
						top: 0,
						bottom: 0,
						background:'#FFFFFF',
					},
				})
			},
			addFriend:function(item){//加好友
				if(item.friend==2){
					mui.toast("对方已经是你的好友了哦");
					return;
				}
				mui.openWindow('../chat/html/userdetails.html?id='+item.user_id,'userdetails.html', {
					styles: {
						popGesture: "close",
						background:'#FFFFFF',
					},
				});
			},
		},
	});
	mui.init({
		pullRefresh: {
			container: '#pullRefresh',
			 down : {
		      style:'circle',
		      callback :pulldownRefresh
		    },
			up: {
				auto: true,
				contentnomore: '没有更多数据了',
				callback: pullupRefresh
			}
		}
	});
	function pulldownRefresh(){
		vm.page=0;
		pullupRefresh();
		mui('#pullRefresh').pullRefresh().refresh(true);
		mui('#pullRefresh').pullRefresh().endPulldown();
	};
	function pullupRefresh() {
		var $this = this;
		vm.page++;
		yh.ajax({
			url: "/followShopList",
			data: {
				page: vm.page,
				num: 20,
			},
			type: "GET",
			fn: function(data) {
				if(vm.page==1)vm.data=[];
				for(var i = 0; i < data.length; i++) {
					data[i].follow=2;
					vm.data.push(data[i]);
				}
				vm.onOff=false;
				// mui('#pullRefresh').pullRefresh().refresh(true);
				mui('#pullRefresh').pullRefresh().endPullupToRefresh(data.length < 20);
			}
		})
	}
	window.addEventListener('refresh', function(e) {
		pulldownRefresh();
	});
})