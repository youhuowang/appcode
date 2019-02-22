mui.plusReady(function() {
	mui.init({
		beforeback: function() {　　　　
			var list = plus.webview.currentWebview().opener(); //获得父页面的webview 	　　　　
			mui.fire(list, 'refresh'); //触发父页面的自定义事件(refresh),从而进行刷新	
			return true; //返回true,继续页面关闭逻辑
		}
	});
	var vm = new Vue({
		
		el: "#app",
		data: {
			title: '申请入驻',
			onOff: false,
			myimage: '',
			imgid: '',
			appbanner: '',
			shopbanner: '',
			shoppic: '',
			shopname: '',
			username: '',
			provid: '', //省份id
			cityid: '', //城市id
			marketid: '', //市场id
			address: '',
			areas: '',
			ischeckbox: false,
			issend: true,
			token:'',
			waiting:'',
			opencustom:1,
			img_w:'',
			img_h:'',
			img_src:'',
		},
		methods: {
			send: function() {
				if(!vm.issend) return;
				if(vm.appbanner == '' || vm.shopbanner == '' || vm.shoppic == '') {
					mui.toast("请先选择要上传的图片");
					return;
				}
				if(vm.shopname == "" || vm.shopname.length <= 1) {
					mui.toast("店铺名称为空或小于两个字符");
					return;
				}
				if(vm.username == "" || vm.username.length <= 1) {
					mui.toast("姓名不能为空或小于两个字符");
					return;
				}
				if(vm.provid == "") {
					mui.toast("请选择所属市场");
					return;
				}
				if(vm.address.length < 5) {
					mui.toast("详细地址不能为空或小于5个字符");
					return;
				}
				if(vm.address.length < 5) {
					mui.toast("详细地址不能为空或小于5个字符");
					return;
				}
				if(!vm.ischeckbox) {
					mui.toast("请先同意开店协议");
					return;
				}
				vm.issend = false;
				var url = yh.getQueryString('id') ? '/shopEdit' : '/shopEntry';
				yh.ajax({
					url: url,
					type: "post",
					data: {
						appbanner: vm.appbanner,
						shopbanner: vm.shopbanner,
						shoppic: vm.shoppic,
						shopname: vm.shopname,
						username: vm.username,
						provid: vm.provid,
						cityid: vm.cityid,
						marketid: vm.marketid,
						address: vm.address,
						opencustom:vm.opencustom,
					},
					fn: function(reg) {
						vm.issend = true;
						mui.back();
						mui.toast("操作成功");
					}
				}, true, function(reg) {
					vm.issend = true;
					mui.back();
					mui.toast(reg.message);
				});
			},
			openWindow:function(){
				mui.openWindow("_www/module/protocol.html?title=商家入驻协议",'protocol', {
					styles: {
						popGesture: "close",
						background:'#FFFFFF',
					},
				});
			},
			choiceImage: function(w, h, id) {
				var aspectRatio = w / h;
				vm.img_w=w;
				vm.img_h=h;
				vm.imgid = "#" + id;
				var editButtons = new Array();
				editButtons.push({
					title: "拍照上传",
					style: "default"
				});
				editButtons.push({
					title: "从相册选择",
					style: "default"
				});
				plus.nativeUI.actionSheet({
					cancel: "取消",
					buttons: editButtons
				}, function(e) {
					var index = e.index;
					switch(index) {
						case 1:
							vm.captureImage(); //拍照
							break;
						case 2:
							vm.selectImage(); //相册选择
							break;
					}
				});
				vm.initImageCropper(aspectRatio, 1); //初始化裁切组件
			},
			initImageCropper: function(w, h) {
				vm.myimage = $("#image_id").cropper({
					aspectRatio: w / h,
					autoCropArea: 1,
					dragMode: "move", //设置移动图片、重新绘制选图区域
					movable: true, //是否允许移动裁切框
					crop: function(data) { //初始化					
						window._scaleX = data.scaleX;
						window._scaleY = data.scaleY;
					}
				});
				if(vm.myimage != '') vm.myimage.cropper("setAspectRatio", w / h);
			},
			captureImage: function() { //拍照
				var cmr = plus.camera.getCamera(1);
				cmr.captureImage(
					function(path) { //将图片地址转换					
//						plus.io.resolveLocalFileSystemURL(path, function(entry) {
//							var newPath = entry.toLocalURL() + "?version=" + Math.random();
							vm.loadImage(path);
//						});
					},
					function(error) {
//						mui.toast(error.message);
					}, {
						filename: "_doc/checkin/123.jpg",
						format: 'jpg',
					}
				);
			},
			selectImage: function() { //选择图片
				plus.gallery.pick(function(path) {
					vm.loadImage(path);
				}, function(e) {
//					mui.toast("没有选择图片.");
				});
			},
			loadImage: function(path) { //确定选择图片
				vm.onOff = true;
				vm.myimage.src = path;
				vm.myimage.cropper("replace", path);
			},
			sureImage: function() { //剪切
				vm.waiting = plus.nativeUI.showWaiting("图片处理中...");
				var img = $(vm.imgid);
				var dataURL = vm.myimage.cropper("getCroppedCanvas");
				var imgUrl = dataURL.toDataURL("image/jpeg");
				vm.onOff = false;
				vm.putb(imgUrl);
				vm.img_src='http://iph.href.lu/'+vm.img_w+'x'+vm.img_h+'?fg=FFFFFF&text=上传中';
				vm.yh(vm.img_src);
			},
			fileSize:function(str){/*通过base64编码字符流计算文件流大小函数*/
				var fileSize;
				if(str.indexOf('=') > 0) {
					var indexOf = str.indexOf('=');
					str = str.substring(0, indexOf); //把末尾的’=‘号去掉
				}
				fileSize = parseInt(str.length - (str.length / 8) * 2);
				return fileSize;
			},
			getQiniuUpTokenAndUrl:function(){
				yh.ajax({
					url: "/getQiniuUpTokenAndUrl",
					type: "GET",
					fn: function(data) {
						console.log(JSON.stringify(data))
						vm.token=data.token;							
					}
				},true)				
			},
			yh:function(src){
				switch(vm.imgid) {
					case '#recommend':
						vm.appbanner = src;
						break;
					case '#index':
						vm.shopbanner = src;
						break;
					case '#shop':
						vm.shoppic = src;
						break;
				};
			},
			putb: function(pic) {	
				/*把头部的data:image/jpeg;base64,去掉。（注意：base64后面的逗号也去掉）*/
				var picBase = pic.substring(23);
				var url = "http://upload.qiniup.com/putb64/" + this.fileSize(picBase);
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if(xhr.readyState == 4) {
						var keyText=JSON.parse(xhr.responseText);						
						if(keyText.key){
							var src='http://cache.youhuowang.shop/'+keyText.key;
							vm.yh(src);
							vm.waiting.close();
						}else{
							vm.getQiniuUpTokenAndUrl();//token过期重新获取	
							vm.waiting.close();
							vm.img_src='http://iph.href.lu/'+vm.img_w+'x'+vm.img_h+'?text=上传失败';
							vm.yh(vm.img_src);
							mui.toast('上传失败，请稍后重试');
						}
					}
				}
				xhr.open("POST", url, true);
				xhr.setRequestHeader("Content-Type", "application/octet-stream");
				xhr.setRequestHeader("Authorization", "UpToken "+vm.token);
				xhr.send(picBase)
			},
			getCity: function(id) {
				yh.ajax({
					url: '/getCity',
					type: 'get',
					data: {
						provid: id,
					},
					fn: function(data) {
						mobileSelect.updateWheel(1, data.city);
						vm.getCounty(data.city[0].id);
					}
				})
			},
			getCounty: function(id) {
				yh.ajax({
					url: '/getMarket',
					type: 'get',
					data: {
						cityid: id,
					},
					fn: function(data) {
						mobileSelect.updateWheel(2, data);
					}
				})
			},

		}
	})
	vm.getQiniuUpTokenAndUrl();
	if(yh.getQueryString('id')) {
		vm.title = '编辑店铺';
		yh.ajax({
			url: '/shopInfo',
			type: 'get',
			fn: function(data) {
				vm.appbanner = data.appbanner;
				vm.shopbanner = data.shopbanner;
				vm.shoppic = data.shoppic;
				vm.shopname = data.shopname;
				vm.username = data.username;
				vm.areas = data.area;
				vm.address = data.address;
				vm.provid = data.provid;
				vm.cityid = data.cityid;
				vm.marketid = data.marketid;
				vm.opencustom=data.opencustom;
			}
		})
	}
	var province_id = '',
		city = '';
	var mobileSelect = new MobileSelect({
		trigger: '#trigger',
		title: '选择市场',
		wheels: [{
				data: [{
					"id": "18",
					"name": "四川省"
				}],
			},
			{
				data: [{
					"id": "18",
					"name": ""
				}],
			},
			{
				data: [{
					"id": "18",
					"name": ""
				}],
			},
		],
		keyMap: {
			id: 'id',
			value: 'name',
		},
		callback: function(indexArr, data) {
			vm.provid = data[0].id;
			vm.cityid = data[1].id;
			vm.marketid = data[2].id;
		},
		transitionEnd: function(indexArr, data) {
			if(province_id != data[0].id) {
				province_id = data[0].id;
				vm.getCity(data[0].id)
				mobileSelect.locatePosition(1, 0);
				mobileSelect.locatePosition(2, 0);
			} else if(city != data[1].id) {
				city = data[1].id;
				vm.getCounty(data[1].id);
				mobileSelect.locatePosition(2, 0);
			}

		}
	});
	yh.ajax({
		url: '/getProvince',
		type: 'get',
		fn: function(data) {
			mobileSelect.updateWheel(0, data);
			vm.getCity(data[0].id);
		}
	})
})