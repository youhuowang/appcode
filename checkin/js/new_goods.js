mui.plusReady(function() {
	mui.init({
		beforeback: function() {　　　　
			var list = plus.webview.currentWebview().opener(); //获得父页面的webview 	　　　　
			mui.fire(list, 'refresh'); //触发父页面的自定义事件(refresh),从而进行刷新	
			return true; //返回true,继续页面关闭逻辑
		}
	});
	plus.webview.currentWebview().setStyle({
	    softinputMode: "adjustResize"  // 弹出软键盘时自动改变webview的高度
	});
	var vm = new Vue({
		el: "#app",
		data: {
			onOff: false,
			token: '',
			myimage: '',
			imgList: [],
			imgIndex: '',
			myscover: '',
			mycolor: '',
			mysize: '',
			status: false,
			waiting: '',
			goodscover: '',
			goodspic: [],
			title: '', //标题
			goodsno: '', //货号
			material: '', //材质
			istail: yh.getQueryString('istail') || 1, //1：表示不添加到尾货处理 2：表示添加到尾货处理
			retailprice: '', //商品零售价
			wholesaleprice: '', //商品批发价
			packingprice: '', //商品装包价
			tailprice: '', //商品处理价
			color: [], //
			size: [],
			goodsid: yh.getQueryString('id') || '',
			myinput:'',
		},
		mounted: function() {
			mui('.mui-scroll-wrapper').scroll({
				deceleration: 0.0005 //flick 
			});
			$("input").focus(function(){
				vm.myinput=this;
				console.log(mui('.mui-scroll-wrapper').scroll().y)
			})
		},
		methods: {
			choiceImage: function(st, w, h, n) {
				if(vm.imgList.length == 6 && st) return;
				vm.status = st;
				var aspectRatio = w / h;
				vm.imgIndex = n == undefined ? 'hh' : n;
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
				var cmr = plus.camera.getCamera(2);
				cmr.captureImage(
					function(path) { //将图片地址转换					
						plus.io.resolveLocalFileSystemURL(path, function(entry) {
							var newPath = entry.toLocalURL() + "?version=" + Math.random();
							vm.loadImage(newPath);
						});
					},
					function(error) {
//						mui.toast(error.message);
					}, {
						filename: "_documents/"
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
				vm.waiting = plus.nativeUI.showWaiting();
				var dataURL = vm.myimage.cropper("getCroppedCanvas");
				var imgUrl = dataURL.toDataURL("image/jpeg", .1);
				vm.onOff = false;
				if(vm.status) {
					vm.imgIndex != 'hh' ? vm.imgList[vm.imgIndex].img = 'http://iph.href.lu/110x120?text=上传中' : vm.imgList.push({
						img: 'http://iph.href.lu/110x120?text=上传中',
					});
					vm.imgIndex == 'hh' ? vm.imgIndex = vm.imgList.length - 1 : '';
				} else {
					vm.myscover = 'http://iph.href.lu/110x120?text=上传中';
				}
				vm.putb(imgUrl);
			},
			addimg: function(pic, k) {
				if(vm.status) {
					vm.goodspic[vm.imgIndex] ? vm.goodspic[vm.imgIndex] = k : vm.goodspic.push(k);
					vm.imgList[vm.imgIndex].img = pic;
				} else {
					vm.myscover = pic;
					vm.goodscover = k;
				}
				vm.waiting.close();
			},
			deleteImg: function(on, index) {
				if(on) {
					vm.status ? vm.imgList.splice(vm.imgIndex, 1) : vm.myscover = '';
					vm.waiting.close();
				} else if(index != undefined) {
					vm.imgList.splice(index, 1);
					vm.goodspic.splice(index, 1);
				} else {
					vm.myscover = '';
					vm.goodscover = '';
				}
			},
			putb: function(pic) {
				/*把头部的data:image/jpeg;base64,去掉。（注意：base64后面的逗号也去掉）*/
				picBase = pic.substring(23);

				function fileSize(str) { /*通过base64编码字符流计算文件流大小函数*/
					var fileSize;
					if(str.indexOf('=') > 0) {
						var indexOf = str.indexOf('=');
						str = str.substring(0, indexOf); //把末尾的’=‘号去掉
					}
					fileSize = parseInt(str.length - (str.length / 8) * 2);
					return fileSize;
				}
				var list = list;
				var url = "http://upload.qiniup.com/putb64/" + fileSize(picBase);
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function(list) {
					if(xhr.readyState == 4) {
						var keyText = JSON.parse(xhr.responseText);
						if(keyText.key) {
							vm.addimg(pic, keyText.key);
						} else {
							vm.getQiniuUpTokenAndUrl(); //token过期重新获取							
							mui.toast('上传失败，请稍后重试');
							vm.deleteImg(true);
						}
					}
				}
				xhr.open("POST", url, true);
				xhr.setRequestHeader("Content-Type", "application/octet-stream");
				xhr.setRequestHeader("Authorization", "UpToken " + vm.token);
				xhr.send(picBase)
			},
			getQiniuUpTokenAndUrl: function() {
				yh.ajax({
					url: "/getQiniuUpTokenAndUrl",
					type: "GET",
					fn: function(data) {
						vm.token = data.token;
					}
				}, true)
			},
			islength: function(value) {
				if(value == '') return false;
				if(value.length > 5) {
					mui.toast('颜色值不能超过5个字符');
					return false;
				}
				return true;
			},
			addColor: function() {
				if(!vm.islength(vm.mycolor)) return;
				vm.color.push(vm.mycolor);
				vm.mycolor = '';
				var y=$(vm.myinput).offset().top-$('.mui-scroll-wrapper').height()-mui('.mui-scroll-wrapper').scroll().y+30;
				mui('.mui-scroll-wrapper').scroll().scrollTo(0,-y,0);//获取焦点时滚动到指定位置
			},
			addsize: function() {
				if(!vm.islength(vm.mysize)) return;
				vm.size.push(vm.mysize);
				vm.mysize = '';
				var y=$(vm.myinput).offset().top-$('.mui-scroll-wrapper').height()-mui('.mui-scroll-wrapper').scroll().y+30;
				mui('.mui-scroll-wrapper').scroll().scrollTo(0,-y,0);//获取焦点时滚动到指定位置
			},
			preventDefault:function(e){
				e.preventDefault();
			},
			deleteValue: function(list, index) {
				list.splice(index, 1);
				mui('.mui-scroll-wrapper').scroll().reLayout();
			},
			isprice: function(value) {
				return /^(([0-9]|([1-9][0-9]{0,9}))((\.[0-9]{1,2})?))$/.test(value) ? true : false;
			},
			isSend: function() {
				if(vm.goodscover == "") {
					mui.toast('你还没有上传商品封面图哦！');
					return false;
				}
				if(vm.goodspic.length < 1) {
					mui.toast('商品图片不能低于一张！');
					return false;
				}
				if(vm.title == '' || vm.title.length < 2) {
					mui.toast('商品名称不能低于两个字符');
					return false;
				}
				if(vm.goodsno == '' || vm.goodsno.length < 2) {
					mui.toast('货号不能低于两个字符');
					return false;
				}
				if(vm.istail == 1) {
					if(!this.isprice(vm.retailprice)) {
						mui.toast('商品零售价格式不正确');
						return false;
					}
					if(!this.isprice(vm.wholesaleprice)) {
						mui.toast('商品批发价格式不正确');
						return false;
					}
					if(!this.isprice(vm.packingprice)) {
						mui.toast('商品装包价格式不正确');
						return false;
					}
				} else if(vm.istail == 2 && !this.isprice(vm.tailprice)) {
					mui.toast('商品处理价格式不正确');
					return false;
				}
				if(vm.color.length <= 0) {
					mui.toast('商品颜色不能为空');
					return false;
				}
				if(vm.size.length <= 0) {
					mui.toast('商品尺寸不能为空');
					return false;
				}
				return true;
			},
			addGoods: function() {
				if(!this.isSend()) return;
				var url = vm.goodsid == '' ? "/addGoods" : '/editGoods';
				vm.waiting = plus.nativeUI.showWaiting("正在保存..");
				yh.ajax({
					url: url,
					type: "POST",
					data: {
						goodsid: vm.goodsid,
						goodscover: vm.goodscover,
						goodspic: vm.goodspic,
						title: vm.title,
						goodsno: vm.goodsno,
						material: vm.material,
						istail: vm.istail,
						retailprice: vm.retailprice,
						wholesaleprice: vm.wholesaleprice,
						packingprice: vm.packingprice,
						tailprice: vm.tailprice,
						color: vm.color,
						size: vm.size,
					},
					fn: function(data) {
						vm.waiting.close();
						mui.toast('保存成功');
						mui.back();
					}
				}, true, function(reg) {
					mui.toast(reg.message)
					vm.waiting.close();
				})
			}
		},
	})
	$(window).on('resize', function() {
		console.log(mui('.mui-scroll-wrapper').scroll().y+"--y--")
		console.log($(vm.myinput).offset().top+"--top-")
		console.log($('.mui-scroll-wrapper').height()+"--height---")
		console.log($(vm.myinput).offset().top-$('.mui-scroll-wrapper').height()-mui('.mui-scroll-wrapper').scroll().y)
		var y=$(vm.myinput).offset().top-$('.mui-scroll-wrapper').height()-mui('.mui-scroll-wrapper').scroll().y;
		mui('.mui-scroll-wrapper').scroll().scrollTo(0,-y,0);//获取焦点时滚动到指定位置
	});
	vm.getQiniuUpTokenAndUrl();
	if(vm.goodsid) {
		vm.waiting = plus.nativeUI.showWaiting("加载中..");
		yh.ajax({
			url: "/goodsInfo",
			type: "GET",
			data: {
				goodsid: vm.goodsid,
			},
			fn: function(data) {
				vm.myscover = vm.goodscover = data.goodscover;
				data.goodspic.forEach(function(value, i) {
					vm.imgList.push({
						img: value
					})
				})
				vm.goodspic = data.goodspic;
				vm.title = data.title;
				vm.goodsno = data.goodsno;
				vm.material = data.material;
				vm.retailprice = data.retailprice;
				vm.wholesaleprice = data.wholesaleprice;
				vm.packingprice = data.packingprice;
				vm.istail = data.istail;
				vm.tailprice = data.tailprice;
				vm.color = data.color;
				vm.size = data.size;
				vm.waiting.close();
			}
		}, true)
	}
})