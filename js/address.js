mui.plusReady(function() {
	document.getElementById('list').style.height='0px';
	mui.init({
		beforeback: function() {　　　　
			var list = plus.webview.currentWebview().opener(); 	　　　　
			mui.fire(list, 'refresh'); 
			return true; 
		}
	});
	window.addEventListener('refresh', function(e) {
		plus.geolocation.getCurrentPosition(function(position) {
			if(position.address) {				
				vm.address=position.address.city;
			} 	
		});
	});
	var vm = new Vue({
		el: "#app",
		data: {
			address:plus.storage.getItem('address')||'',
			city: '',
			hotCity: '',
			keyword:'',
		},
		methods: {
			getCounty: function(id, v) {
				if(id == '') return;
				if(vm.aaddress != v)plus.storage.setItem('address', v);
				plus.storage.setItem('county', '')
				mui.openWindow('newlocation.html?id=' + id, 'newlocation.html', {
					styles: {
						popGesture: "close",
						background:'#FFFFFF',
					},
				});
			},
			searchCity:function(){
				if(vm.keyword=="")return;
				yh.ajax({
					url: "/searchCity",
					type: "get",
					data:{
						keyword:vm.keyword,
					},
					fn: function(data) {
						vm.city = data;
					}
				});
			}
		},
		watch: {
			hotCity: function() {
				this.$nextTick(function() {
					var main = document.querySelector('.main'),
						header = document.querySelector('.head'),
						list = document.getElementById('list');
					list.style.height = (document.body.offsetHeight  - main.offsetHeight) + 'px';
					window.indexedList = new mui.IndexedList(list);					
				})
			},
		}
	});
	plus.geolocation.getCurrentPosition(function(position) {
		if(position.address) {				
			vm.address=position.address.city;
		} 	
	});
	yh.ajax({
		url: "/getCity",
		type: "get",
		fn: function(data) {
			var list = [];
			var k;
			for(var key in data.city) {
				k = {
					id: '',
					name: key,
					spelling: key
				};
				list.push(k);
				data.city[key].forEach(function(value, i) {
					list.push(value);
				})
			}
			vm.city = list;
			vm.hotCity = data.hotCity;
		}
	});
})
