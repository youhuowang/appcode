mui.plusReady(function(){
	window.addEventListener('refresh', function(e) {
		pullfresh();//返回刷新
		vm.addFriend=localStorage.getItem("addFriend");
	});
	mui.init({
		beforeback: function() {　　　　
			var list = plus.webview.currentWebview().opener(); 　　　　
			mui.fire(list, 'refresh'); 
			return true; //
		}
	});
	var vm=new Vue({
		el:"#app",
		data:{
			data:'',
			addFriend:localStorage.getItem("addFriend"),
		},
		mounted:function(){
			mui('body').on('tap','a[href]', function() {
				var href = this.getAttribute('href');
				var id = this.getAttribute("data-wid") || href;
				if(id.indexOf("?") != -1) id = id.split("?")[0];
				if(href && ~href.indexOf('.html')) mui.openWindow(href, id, {
					styles: {
						popGesture: "close",
						background:'#FFFFFF',
					},
				});
			})
		},
		methods:{
			gofriendInfo:function(id){
				mui.openWindow('userdetails.html?id='+id,'userdetails.html', {
					styles: {
						popGesture: "close",
						background:'#FFFFFF',
					},
				});
			}
		},
	});
	mui('body').on('tap','a[tag]', function() {
		vm.openWindow(this);
	});
	function pullfresh(){
		yh.ajax({
			url: "/friendList",
			type: "get",
			fn: function(data) {
				for (var i=0;i<data.length;i++) {
					data[i].checkbox=i==0?true:false;
				}
				vm.data=data;
			}
		},true)
	};
	pullfresh();
})