if( ASSETS.project && ( ASSETS.project.path == g_CurPath()))
{
	prj_Init();
}

function prj_Init()
{
	a_SetLabel('Project');
	n_GetFile({"path":'rules/assets/project.html',"func":prj_InitHTML,"info":'project.html',"parse":false});
}
function prj_InitHTML( i_data)
{
	$('asset').innerHTML = i_data;
}

prj_deploy_shots_params = {};
prj_deploy_shots_params.sources = {};
prj_deploy_shots_params.references = {};
prj_deploy_shots_params.template = {};
prj_deploy_shots_params.destination = {};
prj_deploy_shots_params.sameshot  = {"width":'25%','type':"bool",'default':false,"tooltip":'Example: "NAME" and "NAME-1" will be one shot.'};
prj_deploy_shots_params.extract   = {"width":'25%','type':"bool",'default':false,"tooltip":'Extract sources folder.'};
prj_deploy_shots_params.uppercase = {"width":'25%','type':"bool",'default':false,"tooltip":'Convert shot names to upper case.'};
prj_deploy_shots_params.padding   = {"width":'25%',"tooltip":'Example: "432" - first number will have 4 padding, next 3 and so on.'};

function prj_ShotsDeploy()
{
	var wnd = new cgru_Window({"name":'deploy_shots',"title":'Deploy Shots'});
	wnd.elContent.classList.add('deploy_shots');

	var params = {};
	params.sources = g_CurPath() + '/deploy/src';
//	params.references = g_CurPath() + '/deploy/ref';
	params.template = RULES.assets.shot.template;

//console.log( JSON.stringify( g_elCurFolder.m_dir));
	params.destination = RULES.assets.scenes.seek[0];
	for( var s = 0; s < RULES.assets.scenes.seek.length; s++)
		for( var f = 0; f < g_elCurFolder.m_dir.folders.length; f++)
			if( RULES.assets.scenes.seek[s].indexOf( g_elCurFolder.m_dir.folders[f]) != -1 )
				params.destination = RULES.assets.scenes.seek[s];
	params.destination = params.destination.replace('[project]', ASSETS.project.path) + '/deploy';

	gui_Create( wnd.elContent, prj_deploy_shots_params, [params]);

	var elBtns = document.createElement('div');
	wnd.elContent.appendChild( elBtns);
	elBtns.classList.add('param');
	elBtns.style.clear = 'both';

	var elLabel = document.createElement('div');
	elBtns.appendChild( elLabel);
	elLabel.classList.add('label');
	elLabel.innerHTML = '<a href="http://'+cgru_Config.af_servername+':'+cgru_Config.af_serverport+'" target="_blank">AFANASY</a>';

	var elCopy = document.createElement('div');
	elBtns.appendChild( elCopy);
	wnd.m_elCopy = elCopy;
	elCopy.style.display = 'none';
	elCopy.textContent = 'Send Copy Job';
	elCopy.classList.add('button');
	elCopy.m_wnd = wnd;
	elCopy.onclick = function(e){ prj_ShotsDeployDo( e.currentTarget.m_wnd,{"test":false,"move":false});}

	var elMove = document.createElement('div');
	elBtns.appendChild( elMove);
	wnd.m_elMove = elMove;
	elMove.style.display = 'none';
	elMove.textContent = 'Move Sources';
	elMove.classList.add('button');
	elMove.m_wnd = wnd;
	elMove.onclick = function(e){ prj_ShotsDeployDo( e.currentTarget.m_wnd, {"test":false,"move":true});}

	var elTest = document.createElement('div');
	elBtns.appendChild( elTest);
	elTest.textContent = 'Test Sources';
	elTest.classList.add('button');
	elTest.m_wnd = wnd;
	elTest.style.cssFloat = 'right';
	elTest.onclick = function(e){ prj_ShotsDeployDo( e.currentTarget.m_wnd, {"test":true});}

	var elResults = document.createElement('div');
	wnd.elContent.appendChild( elResults);
	wnd.m_elResults = elResults;
	elResults.classList.add('output');

	elResults.textContent = 'Test sources at first.';
}

function prj_ShotsDeployDo( i_wnd, i_args)
{
	var elWait = document.createElement('div');
	i_wnd.elContent.appendChild( elWait);
	i_wnd.m_elWait = elWait;
	elWait.classList.add('wait');

	var cmd = 'rules/bin/deploy_shots.sh';
	var params = gui_GetParams( i_wnd.elContent, prj_deploy_shots_params);

	cmd += ' -s "' + cgru_PM('/' + RULES.root + params.sources, true) + '"';
	if( params.references.length )
		cmd += ' -r "' + cgru_PM('/' + RULES.root + params.references, true) + '"';
	cmd += ' -t "' + cgru_PM('/' + RULES.root + params.template, true) + '"';
	cmd += ' -d "' + cgru_PM('/' + RULES.root + params.destination, true) + '"';
	cmd += ' --shot_src "' + RULES.assets.shot.source.path[0] + '"'
	cmd += ' --shot_ref "' + RULES.assets.shot.references.path[0] + '"'
	if( params.sameshot ) cmd += ' --sameshot';
	if( params.extract ) cmd += ' --extract';
	if( params.uppercase ) cmd += ' -u';
	if( params.padding.length ) cmd += ' -p ' + params.padding;

	if( i_args.move )
		cmd += ' -m';
	else
	{
		cmd += ' -A';
		cmd += ' --afuser "' + g_auth_user.id + '"';
		cmd += ' --afcap ' + RULES.put.af_capacity;
		cmd += ' --afmax ' + RULES.put.af_maxtasks;
	}

	if( i_args.test ) cmd += ' --test';

	n_Request({"send":{"cmdexec":{"cmds":[cmd]}},"func":prj_ShotsDeployFinished,"wnd":i_wnd});
}

function prj_ShotsDeployFinished( i_data, i_args)
{
	i_args.wnd.m_elCopy.style.display = 'block';
	i_args.wnd.m_elMove.style.display = 'block';
	i_args.wnd.elContent.removeChild( i_args.wnd.m_elWait);

	var elResults = i_args.wnd.m_elResults;
	elResults.textContent = '';


	if(( i_data.cmdexec == null ) || ( ! i_data.cmdexec.length ) || ( i_data.cmdexec[0].deploy == null ))
	{
		elResults.textContent = ( JSON.stringify( i_data));
		return;
	}

	var deploy = i_data.cmdexec[0].deploy;
//console.log(JSON.stringify(deploy));

	var el = document.createElement('div');
	elResults.appendChild( el);
	el.textContent = deploy.length + ' shots founded:';

	var elTable = document.createElement('table');
	elResults.appendChild( elTable);

	var elTr = document.createElement('tr');
	elTable.appendChild( elTr);
	var el = document.createElement('th'); elTr.appendChild( el); el.textContent = 'Name';
	var el = document.createElement('th'); elTr.appendChild( el); el.textContent = 'Sequence';
	var el = document.createElement('th'); elTr.appendChild( el); el.textContent = 'Additional sources';
	var el = document.createElement('th'); elTr.appendChild( el); el.textContent = 'Refs';
	var el = document.createElement('th'); elTr.appendChild( el); el.textContent = 'Comments';

	for( var d = deploy.length - 1; d >= 0; d--)
	{
//console.log(JSON.stringify(deploy[d]));
		var elTr = document.createElement('tr');
		elTable.appendChild( elTr);

		for( var key in deploy[d])
		{
			elTr.classList.add( key);

			if( key == 'shot' )
			{
				var shot = deploy[d][key];
console.log(JSON.stringify(shot));

				// Shot name:
				var el = document.createElement('td');
				elTr.appendChild( el);
				el.textContent = shot.name;
				el.classList.add('deploy_name');

				// Main source:
				var el = document.createElement('td');
				elTr.appendChild( el);
				el.textContent = shot.SRC[0];
				el.classList.add('deploy_src');

				// Same sources:
				var el = document.createElement('td');
				elTr.appendChild( el);
				el.classList.add('deploy_src');
				var src = '';
				if( shot.SRC.length > 1 )
					for( var i = 1; i < shot.SRC.length; i++)
						src += ' ' + shot.SRC[i];
				el.textContent = src;
				
				// References:
				var el = document.createElement('td');
				elTr.appendChild( el);
				el.classList.add('deploy_ref');
				var ref = '';
				if( shot.REF && shot.REF.length )
				{
					for( var i = 0; i < shot.REF.length; i++)
						ref += ' ' + shot.REF[i];
				}
				el.textContent = ref;

				// Comments:
				var el = document.createElement('td');
				elTr.appendChild( el);
				el.classList.add('deploy_info');
				var comm = '';
				if( shot.exists )
				{
					comm = 'EXISTS';
					elTr.classList.add('deploy_exist');
				}
				el.textContent = comm;

//console.log( JSON.stringify( shot));
				break;
			}
			else
			{
				var el = document.createElement('td');
				elTr.appendChild( el);
				el.textContent = key + ': ' + deploy[d][key];
			}
		}
	}
}

