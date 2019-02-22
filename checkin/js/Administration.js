mui.plusReady(function() {
	window.addEventListener('refresh', function(e) {
		vm.waiting = plus.nativeUI.showWaiting("正在刷新 ..");
		vm.page=0;		
		pullupRefresh(true); //返回刷新余额
	});
	var vm = new Vue({
		el: "#app",
		data: {
			page: 0,
			data: [],
			waiting:'',
		},
		methods:{
			toggleGoods:function(item){
				var url=item.recommend==1?'/recommendGoods':'/unRecommendGoods';
				var message=item.recommend==1?'商品推荐成功':'取消商品推荐成功';
				yh.ajax({
					url: url,
					type: "POST",
					data: {
						goodsid:item.id,
					},
					fn: function(data) {
						item.recommend=item.recommend==1?2:1;
						mui.toast(message);
					}
				}, true)
			},
			lowerShelfGoods:function(id,index){//下架
				yh.ajax({
					url: '/lowerShelfGoods',
					type: "POST",
					data: {
						goodsid:id,
					},
					fn: function(data) {
						vm.data.splice(index,1)
						mui.toast('操作成功');						
					}
				}, true)
			},
			toggole:function(item){
				console.log(item.toggole);
				
			},
			delGoods:function(id,index){//删除
				yh.ajax({
					url: '/delGoods',
					type: "POST",
					data: {
						goodsid:id,
					},
					fn: function(data) {
						vm.data.splice(index,1)
						mui.toast('操作成功');						
					}
				}, true)
			}
		}
	})
	mui('body').on('tap', 'a[href]', function() {
		var href = this.getAttribute('href');
		var id = this.getAttribute("data-wid") || href;
		if(id.indexOf("?") != -1)id = id.split("?")[0];
		if(href && ~href.indexOf('.html'))mui.openWindow(href, id, {
			styles: {
				popGesture: "close"
			},
		});
		return;
	});
	mui.init({
	  pullRefresh : {
	    container:"#pullrefresh",
	    up : {
	      height:50,//可选.默认50.触发上拉加载拖动距离
	      auto:true,//可选,默认false.自动上拉加载一次
	      callback :pullupRefresh //必选，刷新函数，根据具体业务来编写，比如通过ajax从服务器获取新数据；
	    }
	  }
	});
	function pullupRefresh(on) {
		vm.page++;
		yh.ajax({
			url: "/goodsList",
			type: "GET",
			data: {
				page: vm.page,
				num: 20,
			},
			fn: function(data) {
				if(on)vm.data=[];
				for(var i = 0; i < data.length; i++) {
					data[i].toggole=false;
					vm.data.push(data[i]);
				}
				if(vm.waiting!='')vm.waiting.close();
				mui('#pullrefresh').pullRefresh().disablePullupToRefresh(data.length<20);
			}
		}, true)
	}
})