g_cycle = 0;
g_last_msg_cycle = g_cycle;
g_id = 0;
g_uid = -1;
g_keysdown = '';

g_auth = {};
g_digest = null;

g_windows = [];
g_recievers = [];
g_refreshers = [];
g_monitors = [];
g_cur_monitor = null;
g_main_monitor = null;
g_main_monitor_type = 'jobs';
g_monitor_buttons = [];

g_TopWindow = null;

g_HeaderOpened = false;
g_FooterOpened = false;

g_Images = [];

function cgru_params_OnChange( i_param, i_value) { cm_ApplyStyles();}

function g_Init()
{
	g_Info('HTML body load.');
	cgru_Init();

	window.onbeforeunload = g_OnClose;
	document.body.onkeydown = g_OnKeyDown;

	$('platform').textContent = cgru_Platform;
	$('browser').textContent = cgru_Browser;

	if( localStorage.main_monitor )
		g_main_monitor_type = localStorage.main_monitor;

	var header = $('header');
	g_monitor_buttons = header.getElementsByClassName('mbutton');
	for( var i = 0; i < g_monitor_buttons.length; i++)
		g_monitor_buttons[i].onclick = function(e){return g_MButtonClicked(e.currentTarget.textContent,e);};

	g_GetConfig();
}

function g_GetConfig()
{
	var obj = {"get":{"type":"config"}};
	nw_request({"send":obj,"func":g_ConfigReceived});
}
function g_ConfigReceived( i_obj)
{
	if( i_obj.realm )
	{
		if( g_digest )
		{
			g_Error('Access denied.');
			g_DigestRemove();
			return;
		}
		g_DigestInit( i_obj);
		return;
	}

	if( i_obj.cgru_config )
	{
		if( false == cgru_ConfigLoad( i_obj.cgru_config))
		{
			g_Error('Invalid config recieved.');
			return;
		}
	}

	if( g_digest == null )
	{
		cgru_params.push(['user_name','User Name', 'coord', 'Enter user name<br/>Need restart (F5)']);
		$('auth_parameters').style.display = 'none';
	}
	cgru_params.push(['host_name','Host Name', 'pc','Enter host name<br/>Needed for logs only']);
	cgru_params.push(['run_symbol','Run Symbol', '★','Enter any <a href="http://en.wikipedia.org/wiki/Miscellaneous_Symbols" target="_blank">unicode</a><br/>You can copy&paste some:<br>★☀☢☠☣☮☯☼♚♛♜☹♿⚔☻⚓⚒⚛⚡⚑☭']);

	cgru_ConstructSettingsGUI();
	cgru_InitParameters();
	cm_ApplyStyles();

	nw_GetSoftwareIcons();
	g_RegisterSend();
	g_Refresh();
}

function g_DigestInit( i_obj)
{
	g_digest = null;
	g_auth.nc = 0;

	if( i_obj )
	{
		g_auth.nonce = i_obj.nonce;

		if(( localStorage.digest == null )
		|| ( localStorage.realm  == null )
		|| ( localStorage.realm != i_obj.realm )
		|| ( localStorage.user_name == null)
		|| ( localStorage.user_name.length < 1 ))
		{
			g_DigestRemove();
			localStorage.realm = i_obj.realm;
			g_DigestAsk();
			return;
		}
	}

	g_digest = localStorage.digest;
	g_auth.user_name = localStorage.user_name;
	$('auth_user').textContent = localStorage.user_name;
	g_GetConfig();
}
function g_DigestAsk()
{
	new cgru_Dialog({"handle":'g_DigestAskPasswd',"type":'str',"name":'settings',"title":'Login',"info":'Enter User Name'});
//	new cgru_Dialog( window, window, 'g_DigestAskPasswd', null, 'str', '', 'settings', 'Login', 'Enter User Name');
}
function g_DigestAskPasswd( i_value)
{
	localStorage.user_name = i_value;
	new cgru_Dialog({"handle":'g_DigestConstruct',"type":'str',"name":'settings',"title":'Login',"info":'Enter Password'});
//	new cgru_Dialog( window, window, 'g_DigestConstruct', null, 'str', '', 'settings', 'Login', 'Enter Password');
}
function g_DigestConstruct( i_value)
{
	localStorage.digest = hex_md5( localStorage.user_name + ':' + localStorage.realm + ':' + i_value);
	g_DigestInit();
}
function g_DigestRemove()
{
	localStorage.removeItem('digest');
	localStorage.removeItem('realm');
}
function g_Logout()
{
	g_DigestRemove();
	window.location.reload();
}

function g_RegisterSend()
{
	if( g_id != 0)
		return;

	g_Info('Sending register request.');

	var obj = {};
	obj.monitor = {};
	obj.monitor.gui_name = localStorage['gui_name'];
	obj.monitor.user_name = localStorage['user_name'];
	obj.monitor.host_name = localStorage['host_name'];
	obj.monitor.engine = navigator.userAgent;
	nw_send(obj);

	setTimeout('g_RegisterSend()', 5000);
}

function g_ProcessMsg( i_obj)
{
//g_Info( g_cycle+' Progessing '+g_recievers.length+' recieves');
	g_last_msg_cycle = g_cycle;

	// Realm is sended if message not authorized
	if( i_obj.realm )
	{
		g_Error('Authentication problems...');
		return;
	}

	// Preload images (service icons):
	if( i_obj.files && i_obj.path )
	{
		for( var i = 0; i < i_obj.files.length; i++)
		{
			var img = new Image();
			img.src = i_obj.path + "/" + i_obj.files[i];
			g_Images.push( img);
		}
		return;
	}

	if( i_obj.monitor )
	{
		if(( g_id == 0 ) && ( i_obj.monitor.id > 0 ))
		{
			// Monitor is not registered and recieved an ID:
			g_RegisterRecieved( i_obj.monitor);
		}
		else if( i_obj.monitor.id != g_id )
		{
			// Recieved ID does not match:
			g_Info('This ID = '+g_id+' != '+i_obj.monitor.id+' recieved.');
			g_Deregistered();
		}
		return;
	}

	if( i_obj.message || i_obj.object || i_obj.task_exec )
	{
		g_ShowObject( i_obj);
		return;
	}

	if( g_id == 0 )
		return;

	for( var i = 0; i < g_recievers.length; i++)
	{
		g_recievers[i].processMsg( i_obj);
	}
}

function g_Refresh()
{
	if(( g_last_msg_cycle != null ) && ( g_last_msg_cycle < g_cycle - 10 ))
		g_ConnectionLost();

	g_cycle++;
	setTimeout("g_Refresh()", 1000);

	if( g_id == 0 )
		return;

	nw_GetEvents('monitors','events');

	for( var i = 0; i < g_refreshers.length; i++)
	{
		g_refreshers[i].refresh();
	}
}

function g_RegisterRecieved( i_obj)
{
	g_id = i_obj.id;
	if( i_obj.uid && ( i_obj.uid > 0 ))
		g_uid = i_obj.uid;

	this.document.title = 'AF';
	g_Info('Registed: ID = '+g_id+' User = "'+localStorage['user_name']+'"['+g_uid+"]");
	$('registered').textContent = 'Registered';
	$('id').textContent = g_id;
	$('uid').textContent = g_uid;
	$('version').textContent = i_obj.version;

	g_MButtonClicked( g_main_monitor_type);

	g_SuperUserProcessGUI();
}

function g_Deregistered()
{
	if( g_id == 0 )
		return;

	this.document.title = 'AF (deregistered)';
	g_id = 0;
	g_uid = -1;
	g_Info('Deregistered.');
	$('registered').textContent = 'Deregistered';
	$('id').textContent = g_id;
	$('uid').textContent = g_uid;
	g_CloseAllWindows();
	g_CloseAllMonitors();
	g_RegisterSend();
}

function g_ConnectionLost()
{
	if( g_id == 0 )
		return;

	g_Info('Connection Lost.');
	g_Deregistered();
}

function g_MButtonClicked( i_type, i_evt)
{
	for( var i = 0; i < g_monitor_buttons.length; i++)
		if( g_monitor_buttons[i].textContent == i_type )
			if( g_monitor_buttons[i].classList.contains('pushed'))
				return;
			else
				g_monitor_buttons[i].classList.add('pushed');


	g_OpenMonitor({"type":i_type,"evt":i_evt});
}

function g_MonitorClosed( i_monitor)
{
	for( var i = 0; i < g_monitor_buttons.length; i++)
		if( g_monitor_buttons[i].textContent == i_monitor.name )
			g_monitor_buttons[i].classList.remove('pushed');
	if( g_main_monitor == i_monitor )
		g_main_monitor = null;
}

//function g_OpenMonitor( i_type, i_evt, i_id, i_name)
function g_OpenMonitor( i_args)
{
	if( i_args.name == null )
		i_args.name = i_args.type;

	if( i_args.wnd == null )
		i_args.wnd = window;

	var new_wnd = false;
	if( i_args.evt )
	{
		if( i_args.evt.shiftKey ) new_wnd = true;
		if( i_args.evt.ctrlKey ) new_wnd = true;
		if( i_args.evt.altKey ) new_wnd = true;
	}

	for( var i = 0; i < g_monitors.length; i++)
		if( g_monitors[i].name == i_args.name )
		{
			g_Info('Monitor "'+i_args.name+'" already opened.', false);
			g_monitors[i].window.focus();
			return;
		}

	i_args.elParent = $('content');
	if(( i_args.type == 'tasks' ) && ( new_wnd == false ))
	{
		if( g_TopWindow )
		{
			g_TopWindow.destroy();
		}

		g_TopWindow = new cgru_Window({"name":'tasks',"title":i_args.name,"wnd":i_args.wnd,"closeOnEsc":false,"addClasses":["cgru_absolute","tasks"]});
		g_TopWindow.closeOnEsc = false;
		g_TopWindow.onDestroy = function(){ g_TopWindow.monitor.destroy(); g_TopWindow = null;};

		i_args.elParent = g_TopWindow.elContent;
	}
	else if( new_wnd )
	{
		i_args.wnd = g_OpenWindowWrite( i_args.name);
		if( i_args.wnd == null ) return;
		i_args.elParent = i_args.wnd.document.body;
	}
	else if( g_main_monitor )
		g_main_monitor.destroy();

	var monitor = new Monitor( i_args);

	if( new_wnd )
	{
		i_args.wnd.monitor = monitor;
		i_args.wnd.onbeforeunload = function(e){e.currentTarget.monitor.destroy()};
	}
	else if( i_args.type == 'tasks')
	{
		g_TopWindow.monitor = monitor;
	}
	else
	{
		g_main_monitor = monitor;
		g_main_monitor_type = i_args.type;
		localStorage.main_monitor = i_args.type;
	}

	return monitor;
}

function g_CloseAllMonitors()
{
	cgru_ClosePopus();

//	for( var i = 0; i < g_monitor_buttons.length; i++)
//		g_monitor_buttons[i].classList.remove('pushed');

	while( g_monitors.length > 0 )
		g_monitors[0].destroy();
}

function g_ShowObject( i_data, i_args)
{
	var object = i_data;
	var type = 'object';
	if( i_data.object )
		object = i_data.object;
	else if( i_data.message )
	{
		object = i_data.message;
		type = 'message';
	}
	else if( i_data.task_exec )
	{
		object = i_data.task_exec;
		type = 'task_exec';
	}

	if( i_args == null )
	{
		g_Log('Global object received.');
		i_args = {};
	}

	var new_wnd = false;
	var wnd = window;
	if( i_args.wnd )
	{
		wnd = i_args.wnd;
	}
	var doc = wnd.document;
	if( i_args.evt )
	{
		if( i_args.evt.shiftKey ) new_wnd = true;
		if( i_args.evt.ctrlKey ) new_wnd = true;
		if( i_args.evt.altKey ) new_wnd = true;
	}
	var title = 'Object';
	if( object.name ) title = object.name;
	if( i_args.name ) title = i_args.name;
	if( object.type ) title += ' ' + object.type;

	var elContent = null;
	if( new_wnd )
	{
		wnd = g_OpenWindowWrite('window.html', title);
		if( wnd == null ) return;
		elContent = wnd.document.body;
		doc = wnd.document;
		wnd.document.title = title;
	}
	else
	{
		wnd = new cgru_Window({"name":title,"wnd":wnd});
		elContent = wnd.elContent;
	}

	if( type == 'message')
	{
		for( var i = 0; i < object.list.length; i++)
		{
			var el = document.createElement('p');
			el.innerHTML = object.list[i].replace(/\n/g,'<br/>');
			elContent.appendChild(el);
		}
	}
	else if( type == 'task_exec')
	{
		t_ShowExec( object, elContent, doc);
	}
	else
	{
		var el = document.createElement('p');
		el.innerHTML = JSON.stringify( object, null, '&nbsp&nbsp&nbsp&nbsp').replace(/\n/g,'<br/>');
		elContent.appendChild(el);
	}
}

function g_OpenWindowLoad( i_file, i_name)
{
	for( var i = 0; i < g_windows.length; i++)
		if( g_windows[i].name == i_name )
			g_windows[i].close();

	var wnd = window.open('afanasy/browser/' + i_file, name, 'location=no,scrollbars=yes,resizable=yes,menubar=no');
	if( wnd == null )
	{
		g_Error('Can`t open window "'+i_file+'"');
		return;
	}
	g_windows.push( wnd);
	wnd.name = i_name;
	wnd.focus();
	return wnd;
}

function g_OpenWindowWrite( i_name, i_title, i_notFinishWrite )
{
	if( i_title == null )
		i_title = i_name;

	for( var i = 0; i < g_windows.length; i++)
		if( g_windows[i].name == i_name )
			g_windows[i].close();

	var wnd = window.open( null, i_name, 'location=no,scrollbars=yes,resizable=yes,menubar=no');
	if( wnd == null )
	{
		g_Error('Can`t open new browser window.');
		return;
	}

	g_windows.push( wnd);
	wnd.name = i_name;

	wnd.document.writeln('<!DOCTYPE html>');
	wnd.document.writeln('<html><head><title>'+i_title+'</title>');
	wnd.document.writeln('<link type="text/css" rel="stylesheet" href="lib/styles.css">');
	wnd.document.writeln('<link type="text/css" rel="stylesheet" href="afanasy/browser/style.css">');
	if(( i_notFinishWrite == null ) || ( i_notFinishWrite == false ))
	{
		wnd.document.writeln('</head><body></body></html>');
		wnd.document.body.onkeydown = g_OnKeyDown;
	}
	if( wnd.document.body )
	{
		if( localStorage.background ) wnd.document.body.style.background = localStorage.background;
		if( localStorage.text_color ) wnd.document.body.style.color = localStorage.text_color;
	}
	wnd.focus();

	return wnd;
}

function g_CloseAllWindows()
{
	for( var i = 0; i < g_windows.length; i++)
		g_windows[i].close();
}

function g_HeaderButtonClicked()
{
	var header = $('header');
	var button = $('headeropenbutton');
	if( g_HeaderOpened )
	{
		header.style.top = '-200px';
		button.innerHTML = '&darr;';
		g_HeaderOpened = false;
	}
	else
	{
		header.style.top = '0px';
		button.innerHTML = '&uarr;';
		g_HeaderOpened = true;
	}
}
function g_FooterButtonClicked()
{
	var footer = $('footer');
	var button = $('footeropenbutton');
	if( g_FooterOpened )
	{
		footer.style.height = '26px';
		button.innerHTML = '&uarr;';
		$('log_btn').classList.remove('pushed');
		$('netlog_btn').classList.remove('pushed');
		$('log').style.display = 'none';
		$('netlog').style.display = 'none';
		$('log_btn').style.display = 'none';
		$('netlog_btn').style.display = 'none';
		g_FooterOpened = false;
	}
	else
	{
		footer.style.height = '226px';
		button.innerHTML = '&darr;';
		$('log_btn').classList.add('pushed');
		$('log').style.display = 'block';
		$('log_btn').style.display = 'block';
		$('netlog_btn').style.display = 'block';
		g_FooterOpened = true;
	}
}
function g_LogButtonClicked( i_type)
{
	var btn_log = $('log_btn');
	var btn_net = $('netlog_btn');
	var log = $('log');
	var netlog = $('netlog');
	if( i_type == 'log' )
	{
		btn_log.classList.add('pushed');
		btn_net.classList.remove('pushed');
		log.style.display = 'block';
		netlog.style.display = 'none';
	}
	else
	{
		btn_net.classList.add('pushed');
		btn_log.classList.remove('pushed');
		netlog.style.display = 'block';
		log.style.display = 'none';
	}
}
function g_Log( i_msg, i_log)
{
	if( i_log == null ) i_log = 'log';
	var log = $( i_log);
	var lines = log.getElementsByTagName('div');
	if( lines.length && ( i_msg == lines[0].msg ))
	{
		var count = lines[0].msg_count + 1;
		var msg = '<i>'+g_cycle+' x'+count+':</i> '+i_msg;
		lines[0].innerHTML = msg;
		lines[0].msg_count = count;
		return;
	}

	var line = document.createElement('div');
	line.msg = i_msg;
	line.msg_count = 1;
	var msg = '<i>'+g_cycle+':</i> '+i_msg;
	line.innerHTML = msg;
	log.insertBefore( line, lines[0]);
	if( lines.length > 100 )
		log.removeChild( lines[100]);
}
function g_Info( i_msg, i_log)
{
	$('info').textContent=i_msg;
	if( i_log == null || i_log == true )
		g_Log( i_msg);
}
function g_Error( i_err, i_log)
{
	g_Info('Error: ' + i_err, i_log);
}

function g_OnClose()
{
	localStorage.main_monitor = g_main_monitor_type
;
	var operation = {};
	operation.type = 'deregister';
	if( g_id)
		nw_Action('monitors', [g_id], operation);

	g_CloseAllWindows();
	g_CloseAllMonitors();
}

function g_OnKeyDown(e)
{
	if( ! e ) return;
	if( e.keyCode == 27 ) // ESC
	{
		if( cgru_EscapePopus())
			return;
		for( var i = 0; i < g_monitors.length; i++)
			g_monitors[i].selectAll( false);
		return;
	}

	if( cgru_DialogsAll.length || cgru_MenusAll.length ) return;

	if(e.keyCode==65 && e.ctrlKey) // CTRL+A
	{
		if( g_cur_monitor) g_cur_monitor.selectAll( true);
		return false;
	}
	else if((e.keyCode==38) && g_cur_monitor) g_cur_monitor.selectNext( e, true ); // UP
	else if((e.keyCode==40) && g_cur_monitor) g_cur_monitor.selectNext( e, false); // DOWN
//	else if(evt.keyCode==116) return false; // F5
//$('test').textContent='key down: ' + e.keyCode;
//	return true;

	g_keysdown += String.fromCharCode( e.keyCode);
	if( g_keysdown.length > 5 )
		g_keysdown = g_keysdown.slice( g_keysdown.length - 5, g_keysdown.length);
//g_Info( g_keysdown );
	g_CheckSequence();
}

function g_CheckSequence()
{
	var god = ( g_keysdown == 'IDDQD' );
	var visor = false;
	if( god ) visor = true;
	else visor = ( g_keysdown == 'IDKFA' );

	if(( visor == false ) && ( god == false ))
		return;

	if( localStorage['visor'] )
	{
		localStorage.removeItem('visor');
		localStorage.removeItem('god');
		g_Info('USER MODE');
	}
	else
	{
		if( visor )
		{
			localStorage['visor'] = true;
			g_Info('VISOR MODE');
		}
		if( god )
		{
			localStorage['god'] = true;
			g_Info('GOD MODE');
		}
	}
	g_SuperUserProcessGUI();
}
function g_VISOR()
{
	if( localStorage['visor'] ) return true;
	if( g_uid < 1 ) return true;
	return false;
}
function g_GOD()
{
	if( localStorage['god'] ) return true;
	if( g_uid < 1 ) return true;
	return false;
}
function g_SuperUserProcessGUI()
{
//g_Info('g_SuperUserProcessGUI()')
	if( g_GOD())
	{
		$('header').classList.add('su_god');
		$('footer').classList.add('su_god');
	}
	else if( g_VISOR())
	{
		$('header').classList.add('su_visor');
		$('footer').classList.add('su_visor');
	}
	else
	{
		$('header').classList.remove('su_visor');
		$('header').classList.remove('su_god');
		$('footer').classList.remove('su_visor');
		$('footer').classList.remove('su_god');
	}
}
/*
function g_ShowTask( i_obj)
{
	var title = 'Task '+i_obj.name;
	var wnd = g_OpenWindowWrite( title, title, true);
	if( wnd == null ) return;
	var doc = wnd.document;

	var obj_str = JSON.stringify( i_obj, null, '&nbsp&nbsp&nbsp&nbsp');
	var cmd = i_obj.command;
	var cmdPM = cgru_PM( cmd);
	var wdir = i_obj.working_directory;
	var wdirPM = cgru_PM( wdir);

	doc.write('</head><body class="task_exec">');
	doc.write('<div><i>Name:</i> <b>'+i_obj.name+'</b></div>');
	doc.write('<div><i>Capacity:</i> <b>'+i_obj.capacity+'</b> <i>Service:</i> <b>'+i_obj.service+'</b> <i>Parser:</i> <b>'+i_obj.parser+'</b></div>');
	if( wdir == wdirPM )
	{
		doc.write('<div><i>Working Directory:</i></div>');
		doc.write('<div class="param">'+wdir+'</div>');
	}
	else
	{
		doc.write('<div><i>Working Directory:</i></div>');
		doc.write('<div class="param">'+wdir+'</div>');
		doc.write('<div><i>Working Directory Client = "'+cgru_Platform+'":</i></div>');
		doc.write('<div class="param">'+wdirPM+'</div>');
	}
	if( cmd == cmdPM )
	{
		doc.write('<div><i>Command:</i></div>');
		doc.write('<div class="param">'+cmd+'</div>');
	}
	else
	{
		doc.write('<div><i>Command:</i></div>');
		doc.write('<div class="param">'+cmd+'</div>');
		doc.write('<div><i>Command Client = "'+cgru_Platform+'":</i></div>');
		doc.write('<div class="param">'+cmdPM+'</div>');
	}

	if( i_obj.files && i_obj.files.length )
	{
		doc.write('<div><i>Files:</i></div>');
		for( var f = 0; f < i_obj.files.length; f++)
		{
			doc.write('<div>');
			doc.write('<div class="param">' + i_obj.files[f] + '</div>');
			var cmds = cgru_Config.previewcmds;
			for( var c = 0; c < cmds.length; c++ )
			{
				cmd = cmds[c].replace('@ARG@', cgru_PathJoin( wdirPM, i_obj.files[f]));
				doc.write('<div class="cmdexec">'+cmd+'</div>');
			}
			doc.write('</div>');
		}
	}

	if( i_obj.parsed_files && i_obj.parsed_files.length )
	{
		doc.write('<div style="overflow:auto">');
		for( var f = 0; f < i_obj.parsed_files.length; f++)
		{
//			doc.write('<div>');
			doc.write('<span class="param" id="task_parsed_file">' + cm_PathBase( i_obj.parsed_files[f]) + '</span>');
//			doc.write('</div>');
		}
		doc.write('</div>');
	}

	doc.write('<div>Raw Object:</div><div class="task_data">');
	doc.write( obj_str.replace(/\n/g,'<br/>'));
	doc.write('</div>');

	doc.write('</body></html>');
	doc.close();
	if( cgru_Browser == 'firefox')
		wnd.location.reload();

	$('task_parsed_file').oncontextmenu = function(e) { alert( e.id);};
}
*/
