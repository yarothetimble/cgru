function JobNode() {}

Block_ProgressBarLength = 128;
Block_ProgressBarHeight =  10;

BarDONrgb = '#363';
BarSKPrgb = '#444';
BarDWRrgb = '#141';
BarWDPrgb = '#A2A';
BarRUNrgb = '#FF0';
BarRWRrgb = '#FA0';
BarERRrgb = '#F00';

JobNode.prototype.init = function() 
{
	this.element.classList.add('job');

	cm_CreateStart( this);

	this.elName = document.createElement('span');
	this.elName.classList.add('name');
	this.element.appendChild( this.elName);
	this.elName.classList.add('prestar');

	this.elUserName = cm_ElCreateFloatText( this.element,'right','User Name');
	this.elETA = cm_ElCreateFloatText( this.element,'right','ETA:');

	this.element.appendChild( document.createElement('br'));

	this.elState = document.createElement('span');
	this.element.appendChild( this.elState);
	this.elState.title = 'Job State';
	this.elState.classList.add('prestar');

	this.elTime = cm_ElCreateFloatText( this.element, 'right', 'Running Time');
	this.elLifeTime = cm_ElCreateFloatText( this.element, 'right', 'Life Time');
	this.elPPApproval = cm_ElCreateFloatText( this.element, 'right', 'Preview Pending Approval','PPA');
	this.elPriority = cm_ElCreateFloatText( this.element, 'right', 'Priority');
	this.elDependMask = cm_ElCreateFloatText( this.element, 'right', 'Depend Mask');
	this.elDependMaskGlobal = cm_ElCreateFloatText( this.element, 'right', 'Global Depend Mask');
	this.elHostsMask = cm_ElCreateFloatText( this.element, 'right', 'Hosts Mask');
	this.elHostsMaskExclude = cm_ElCreateFloatText( this.element, 'right', 'Exclude Hosts Mask');
	this.elMaxRunTasks = cm_ElCreateFloatText( this.element, 'right', 'Maximum Running Tasks');
	this.elMaxRunTasksPH = cm_ElCreateFloatText( this.element, 'right', 'Maximum Running Tasks Per Host');
	this.elNeedProperties = cm_ElCreateFloatText( this.element, 'right', 'Properties');
	this.elNeedOS = cm_ElCreateFloatText( this.element, 'right', 'OS Needed');
	
	this.blocks = [];
	for( var b = 0; b < this.params.blocks.length; b++)
		this.blocks.push( new JobBlock( this.element, this.params.blocks[b]));

	this.elThumbs = document.createElement('div');
	this.element.appendChild( this.elThumbs);
	this.elThumbs.classList.add('thumbnails');
	this.elThumbs.style.display = 'none';

	this.elAnnotation = document.createElement('div');
	this.element.appendChild( this.elAnnotation);
	this.elAnnotation.title = 'Annotation';
	this.elAnnotation.style.textAlign = 'center';

	this.state = {};
	this.running_tasks = 0;
	this.percentage = 0;
}

JobNode.prototype.update = function( i_obj)
{
	if( i_obj ) this.params = i_obj;

	if( this.params.user_list_order != null )
		this.params.order = this.params.user_list_order;

	cm_GetState( this.params.state, this.state, this.element);
	if( this.params.state == null ) this.params.state = '';
	this.elState.textContent = this.params.state;

	var displayFull = false;
	if( this.state.ERR || this.state.RUN || this.state.SKP ||
	  ((this.state.DON == false) && (this.params.time_started > 0 )))
		displayFull = true;

	this.elName.textContent = this.params.name;
	this.elName.title = 'ID = '+this.params.id;
	this.elPriority.textContent = 'P' + this.params.priority;
	this.elUserName.textContent = this.params.user_name;

	if( this.params.ppa )
		this.elPPApproval.style.display = 'block';
	else
		this.elPPApproval.style.display = 'none';

	if( this.params.thumb_path )
		this.showThumb( this.params.thumb_path );

	if( this.params.time_life )
		this.elLifeTime.textContent = 'L' + cm_TimeStringFromSeconds( this.params.time_life);
	else this.elLifeTime.textContent = '';

	if( this.params.depend_mask )
		this.elDependMask.textContent = 'D(' + this.params.depend_mask + ')';
	else this.elDependMask.textContent = '';

	if( this.params.depend_mask_global )
		this.elDependMaskGlobal.textContent = 'G(' + this.params.depend_mask_global + ')';
	else this.elDependMaskGlobal.textContent = '';

	if( this.params.hosts_mask )
		this.elHostsMask.textContent = 'H(' + this.params.hosts_mask + ')';
	else this.elHostsMask.textContent = '';

	if( this.params.hosts_mask_exclude )
		this.elHostsMaskExclude.textContent = 'E(' + this.params.hosts_mask_exclude + ')';
	else this.elHostsMaskExclude.textContent = '';

	if( this.params.max_running_tasks != null )
		this.elMaxRunTasks.textContent = 'Max' + this.params.max_running_tasks;
	else this.elMaxRunTasks.textContent = '';

	if( this.params.max_running_tasks_per_host != null )
		this.elMaxRunTasksPH.textContent = 'MPH' + this.params.max_running_tasks_per_host;
	else this.elMaxRunTasksPH.textContent = '';

	if( this.params.need_properties )
		this.elNeedProperties.textContent = this.params.need_properties;
	else this.elNeedProperties.textContent = '';

	if( this.params.need_os)
		this.elNeedOS.textContent = this.params.need_os;
	else this.elNeedOS.textContent = '';

	if( this.params.annotation )
		this.elAnnotation.textContent = this.params.annotation;
	else this.elAnnotation.textContent = '';

	this.running_tasks = 0;
	this.percentage = 0;
	for( var b = 0; b < this.params.blocks.length; b++)
	{
		this.blocks[b].params = this.params.blocks[b];
		this.blocks[b].update( displayFull);
		if( this.blocks[b].params.running_tasks_counter )
			this.running_tasks += this.blocks[b].params.running_tasks_counter;
		if( this.blocks[b].params.p_percentage )
			this.percentage += Math.round( this.blocks[b].params.p_percentage/this.params.blocks.length);
	}

	if( this.running_tasks )
	{
		this.elStar.style.display = 'block';
		this.elStarCount.textContent = this.running_tasks;
	}
	else
		this.elStar.style.display = 'none';

	this.refresh();
}

JobNode.prototype.refresh = function()
{
	var time_txt = '';
	var time_tip = '';
	var eta = '';

	if( this.params.time_wait && this.state.WTM )
	{
		time_txt = cm_TimeStringInterval( new Date().getTime()/1000, this.params.time_wait);
		time_tip = 'Waiting for: ' + cm_DateTimeStrFromSec( this.params.time_wait);
	}
	else if( this.params.time_started )
	{
		if( this.state.DON == true )
		{
			time_txt = cm_TimeStringInterval( this.params.time_started, this.params.time_done )
			time_tip = 'Done at: ' + cm_DateTimeStrFromSec( this.params.time_done);
			time_tip += '\nRunning time: ' + time_txt;
		}
		else
		{
			time_txt = cm_TimeStringInterval( this.params.time_started);

			// ETA (but not for the system job which id == 1):
			if( this.params.id > 1 )
			{
				var percentage = 0;
				for( var b = 0; b < this.blocks.length; b++)
				{
					if( this.blocks[b].params.p_percentage )
						percentage += this.blocks[b].params.p_percentage;
				}
				percentage /= this.blocks.length;
				if(( percentage > 0 ) && ( percentage < 100 ))
				{
					var sec_now = (new Date()).valueOf() / 1000;
					var sec_run = sec_now - this.params.time_started;
					var sec_all = sec_run * 100.0 / percentage;
					eta = sec_all - sec_run;
					if( eta > 0 )
					{
						eta = cm_TimeStringInterval( 0, eta);
						eta = 'ETA≈' + eta;
					}
				}
			}
		}
		time_tip = 'Started at: ' + cm_DateTimeStrFromSec( this.params.time_started) + '\n' + time_tip;
	}

	time_tip = 'Created at: ' + cm_DateTimeStrFromSec( this.params.time_creation) + '\n' + time_tip;

	this.elTime.textContent = time_txt;
	this.elTime.title = time_tip;
	this.elETA.textContent = eta;
}

JobNode.prototype.onDoubleClick = function( i_evt)
{
	g_OpenMonitor({"type":'tasks',"evt":i_evt,"id":this.params.id,"name":this.params.name,"wnd":this.monitor.window});
}

JobNode.prototype.mh_Move = function( i_param)
{
	if( g_uid < 1 )
	{
		g_Error('Can`t move nodes for uid < 1');
		return;
	}
	var operation = {};
	operation.type = i_param.name;
	operation.jids = this.monitor.getSelectedIds();
	nw_Action('users', [g_uid], operation);
	this.monitor.info('Moving Jobs');
}

JobNode.prototype.showThumb = function( i_path)
{
//console.log('JobNode.prototype.showThumb = '+i_path);
	if( this.elThumbs.m_divs == null )
	{
		this.elThumbs.style.display = 'block';
		this.elThumbs.m_divs = [];
	}

	// Do nothing if the last image is the same
	if( this.elThumbs.m_divs.length )
		if( this.elThumbs.m_divs[this.elThumbs.m_divs.length-1].m_path == i_path )
			return;

	var label = cm_PathBase( i_path).replace(/\.jpg$/,'');

	var thumb = document.createElement('div')
	this.elThumbs.appendChild( thumb);
	this.elThumbs.m_divs.push( thumb);
	thumb.m_path = i_path;
	thumb.title = label;

	var name = document.createElement('div');
	name.textContent = label;
	thumb.appendChild( name);

	if( i_path.lastIndexOf('.jpg') == (i_path.length - 4))
	{
		var img = document.createElement('img');
		thumb.appendChild( img);
		img.ondragstart = function(){return false;};
		img.src = '@TMP@' + i_path;
		img.style.display = 'none';
		img.m_height = this.monitor.view_opts.jobs_thumbs_height;
		img.onload = function( e) {
			var img = e.currentTarget;
			if( img.height != img.m_height )
			{
				img.width = img.m_height * img.width / img.height;
				img.height = img.m_height;
			}
			img.style.display = 'block';
		}
	}
	else
		name.style.position = 'relative';

	if( this.elThumbs.m_divs.length > this.monitor.view_opts.jobs_thumbs_num )
	{
		this.elThumbs.removeChild( this.elThumbs.m_divs[0]);
		this.elThumbs.m_divs.splice( 0, 1);
	}
}

// ###################### BLOCK ###################################

function JobBlock( i_elParent, i_block)
{
	this.params = i_block;
	this.job = i_elParent.item;

	this.tasks_num = this.params.tasks_num;

	this.elRoot = document.createElement('div');
	i_elParent.appendChild( this.elRoot);
	this.elRoot.style.clear = 'both';
	this.elRoot.block = this;
	this.elRoot.oncontextmenu = function(e){ e.currentTarget.block.onContextMenu(e); return false;}

	this.service = this.params.service;
	this.elIcon = document.createElement('img');
	this.elRoot.appendChild( this.elIcon);
	this.elIcon.src = 'icons/software/'+this.service+'.png';
	this.elIcon.style.position = 'absolute';
//	this.elIcon.classList.add('icon');

	this.element = document.createElement('div');
	this.elRoot.appendChild( this.element);
	this.element.classList.add('jobblock');

	this.elTasks = cm_ElCreateText( this.element);
	this.elName = cm_ElCreateText( this.element, 'Block Name');
	this.elDepends = cm_ElCreateText( this.element);

	this.elCapacity = cm_ElCreateFloatText( this.element, 'right', 'Tasks Capacity');
	this.elErrSolving = cm_ElCreateFloatText( this.element, 'right');
	this.elForgiveTime = cm_ElCreateFloatText( this.element, 'right', 'Errors Forgive Time');
	this.elMaxRunTime = cm_ElCreateFloatText( this.element, 'right', 'Task Maximum Run Time');
	this.elMaxRunTasks = cm_ElCreateFloatText( this.element, 'right', 'Maximum Running Tasks');
	this.elMaxRunTasksPH = cm_ElCreateFloatText( this.element, 'right', 'Maximum Running Tasks Per Host');
	this.elHostsMask = cm_ElCreateFloatText( this.element, 'right', 'Hosts Mask');
	this.elHostsMaskExclude = cm_ElCreateFloatText( this.element, 'right', 'Exclude Hosts Mask');
	this.elNeedMem = cm_ElCreateFloatText( this.element, 'right', 'Required Memory');
	this.elNeedHDD = cm_ElCreateFloatText( this.element, 'right', 'Required HDD Space');
	this.elNeedPower = cm_ElCreateFloatText( this.element, 'right', 'Needed Power');
	this.elNeedProperties = cm_ElCreateFloatText( this.element, 'right', 'Needed Properties');
	this.elRunTime = cm_ElCreateFloatText( this.element, 'right');
}

JobBlock.prototype.onContextMenu = function( i_e)
{
	i_e.stopPropagation();
	g_cur_monitor = this.job.monitor;

	JobBlock.resetPanels( this.job.monitor);

	var selected_blocks = this.job.monitor.selected_blocks;

	// We should to deselect other jobs blocks,
	// as server can manipulate selected blocks of a one job only
	if( selected_blocks )
	{
		var blocks_to_deselect = [];

		for( var b = 0; b < selected_blocks.length; b++)
		{
			if( this.job.params.id == selected_blocks[b].job.params.id )
				continue;

			var blocks = selected_blocks[b].job.blocks;
			for( var j = 0; j < blocks.length; j++)
				if( blocks_to_deselect.indexOf( blocks[j]) == -1 )
					blocks_to_deselect.push( blocks[j]);
		}

		for( var b = 0; b < blocks_to_deselect.length; b++)
			blocks_to_deselect[b].setSelected( false);
	}

	// If selected, we deselecting it and exit:
	if( this.selected )
	{
		this.setSelected( false);
		if( selected_blocks.length )
			selected_blocks[selected_blocks.length-1].updatePanels();
		return;
	}

	// Select block:
	this.setSelected( true);

	// If jobs selected, select all selected jobs blocks,
	// as server can manipulate all blocks of a several blocks (not special blocks of a selected jobs)
	var jobs = this.job.monitor.getSelectedItems();
	if( jobs.length )
	{
		this.job.monitor.selectAll( false);
		for( var j = 0; j < jobs.length; j++)
		for( var b = 0; b < jobs[j].blocks.length; b++)
			jobs[j].blocks[b].setSelected( true);
	}

	// Update panels info:
	this.updatePanels();
}
JobBlock.prototype.updatePanels = function()
{
	var elBlocks = this.job.monitor.elPanelR.m_elBlocks;
	elBlocks.m_cur_block = this;
	elBlocks.classList.add('active');

	elBlocks.m_elName.style.display = 'block';
	elBlocks.m_elName.textContent = this.params.name;

	for( var p in JobBlock.params )
	{
		if( this.params[p] == null ) continue;

		var el = elBlocks.m_elParams[p];
		el.style.display = 'block';
		el.m_elValue.textContent = this.params[p];
	}

	this.job.monitor.setPanelInfo(this.params.name);
}
JobBlock.resetPanels = function( i_monitor)
{
	var elBlocks = i_monitor.elPanelR.m_elBlocks;
	if( elBlocks.m_cur_block == null )
		return;

	elBlocks.classList.remove('active');
	elBlocks.m_elName.style.display = 'none';
	for( var p in JobBlock.params )
	{
		var el = elBlocks.m_elParams[p];
		el.style.display = 'none';
		el.m_elValue.textContent = '';
	}

	i_monitor.resetPanelInfo();

	elBlocks.m_cur_block = null;
}
JobBlock.prototype.setSelected = function( i_select)
{
	if( this.job.monitor.selected_blocks == null )
		this.job.monitor.selected_blocks = [];

	if( i_select )
	{
		if( this.selected ) return;

		this.selected = true;
		this.element.classList.add('selected');

		this.job.monitor.selected_blocks.push( this);
	}
	else
	{
		if( this.selected != true ) return;

		this.selected = false;
		this.element.classList.remove('selected');

		this.job.monitor.selected_blocks.splice( this.job.monitor.selected_blocks.indexOf( this), 1);
	}
}
JobBlock.deselectAll = function( i_monitor)
{
	if( i_monitor.selected_blocks )
		while( i_monitor.selected_blocks.length )
			i_monitor.selected_blocks[0].setSelected( false);

	JobBlock.resetPanels( i_monitor);
}
JobBlock.setDialog = function( i_args)
{
	var block = i_args.monitor.elPanelR.m_elBlocks.m_cur_block;

	if( block == null )
	{
		g_Error('No block(s) selected.');
		return;
	}

	new cgru_Dialog({"wnd":i_args.monitor.window,"receiver":block,"handle":'setParameter',
		"param":i_args.name,"type":i_args.type,"value":block.params[i_args.name],
		"name":'jobblock_parameter'});
}
JobBlock.prototype.setParameter = function( i_value, i_parameter)
{
	var params = {};
	params[i_parameter] = i_value;
	this.action( null, params);
}
JobBlock.prototype.action = function( i_operation, i_params)
{
	var jids = [];
	var bids = [];

	for( var b = 0; b < this.job.monitor.selected_blocks.length; b++)
	{
		var block = this.job.monitor.selected_blocks[b];

		jid = block.job.params.id;
		if( jids.indexOf( jid) == -1 )
			jids.push( jid);

		bids.push( block.params.block_num);
	}

	// If several jobs selected, we can manipulate only all their blocks.
	if( jids.length > 1 )
		bids = [-1];

	nw_Action('jobs', jids, i_operation, i_params, bids);
}

JobBlock.prototype.constructFull = function()
{
	this.elIcon.style.width = '48px';
	this.elIcon.style.height = '48px';
	this.elIcon.style.marginTop = '4px';
	this.element.style.marginLeft = '54px';

	this.elFull = document.createElement('div');
	this.element.appendChild( this.elFull);
	this.elFull.style.clear = 'both';

	this.elProgress = document.createElement('div');
	this.elFull.appendChild( this.elProgress);
	this.elProgress.classList.add('progress');

	this.elBarDone = document.createElement('div');
	this.elProgress.appendChild( this.elBarDone);
	this.elBarDone.classList.add('bar');
	this.elBarDone.classList.add('DON');
	this.elBarDone.style.height = '4px';
	this.elBarDone.style.cssFloat = 'left';

	this.elBarErr = document.createElement('div');
	this.elProgress.appendChild( this.elBarErr);
	this.elBarErr.classList.add('bar');
	this.elBarErr.classList.add('ERR');
	this.elBarErr.style.height = '4px';
	this.elBarErr.style.cssFloat = 'left';

	this.elBarRun = document.createElement('div');
	this.elProgress.appendChild( this.elBarRun);
	this.elBarRun.classList.add('bar');
	this.elBarRun.classList.add('RUN');
	this.elBarRun.style.height = '4px';
//	this.elBarRun.style.cssFloat = 'left';

	this.elBarPercentage = document.createElement('div');
	this.elProgress.appendChild( this.elBarPercentage);
	this.elBarPercentage.classList.add('bar');
	this.elBarPercentage.classList.add('DON');
	this.elBarPercentage.style.height = '4px';

	this.elCanvas = document.createElement('div');
	this.elProgress.appendChild( this.elCanvas);
	this.elCanvas.style.height = Block_ProgressBarHeight + 'px';
	this.elCanvas.style.width = '100%';

	this.canvas = document.createElement('canvas');
	this.elCanvas.appendChild( this.canvas);
	this.canvas.width  = Block_ProgressBarLength;
	this.canvas.height = Block_ProgressBarHeight;
	this.canvas.style.height = Block_ProgressBarHeight + 'px';
	this.canvas.style.width = '100%';

	this.elPercentage = cm_ElCreateText( this.elFull, 'Block Done Percentage');
	this.elTasksDon = cm_ElCreateText( this.elFull, 'Done Tasks Counter');
	this.elTasksRdy = cm_ElCreateText( this.elFull, 'Ready Tasks Counter');
	this.elTasksRun = cm_ElCreateText( this.elFull, 'Running Tasks Counter');
	this.elTasksSkp = cm_ElCreateText( this.elFull, 'Skipped Tasks Counter');
	this.elTasksWrn = cm_ElCreateText( this.elFull, 'Warning Tasks Counter');
	this.elTasksErr = cm_ElCreateText( this.elFull, 'Error Tasks Counter');

//	this.elTasksDon.classList.add('font-done');
//	this.elTasksRdy.classList.add('font-ready');
//	this.elTasksRun.classList.add('font-run');
//	this.elTasksErr.classList.add('font-error');
	this.elTasksErr.classList.add('ERR');
	this.elTasksErr.style.display = 'none';

	this.elErrHosts = cm_ElCreateFloatText( this.elFull, 'right');
}

JobBlock.prototype.constructBrief = function()
{
	this.elIcon.style.width = '20px';
	this.elIcon.style.height = '20px';
	this.element.style.marginLeft = '24px';

	if( this.elFull)
		this.element.removeChild( this.elFull);
	this.elFull = null;
}

JobBlock.prototype.update = function( i_displayFull)
{
	if( this.displayFull != i_displayFull )
	{
		if( i_displayFull )
			this.constructFull();
		else
			this.constructBrief();
	}
	this.displayFull = i_displayFull;

	if( this.params.name )
	{
		this.elName.textContent = this.params.name;

		var tasks = 't' + this.tasks_num;
		var tasks_title = 'Block tasks:'
		if( this.params.numeric )
		{
			tasks_title += ' Numeric:';
			tasks += '(' + this.params.frame_first + '-' + this.params.frame_last;
			tasks_title += '\nFrame First: ' + this.params.frame_first;
			tasks_title += '\nFrame Last: ' + this.params.frame_last;
			if( this.params.frames_inc > 1 )
			{
				tasks += '/' + this.params.frames_inc;
				tasks_title += '\nIncrement: ' + this.params.frames_inc;
			}
			if( this.params.frames_per_task > 1 )
			{
				tasks += ':' + this.params.frames_per_task;
				tasks_title += '\nFrames Per Task: ' + this.params.frames_per_task;
			}
			if(( this.params.sequential != null ) && ( this.params.sequential != 1 ))
			{
				tasks += '%' + this.params.sequential;
				tasks_title += '\nSequential: ' + this.params.sequential;
			}
			tasks += ')';
		}
		else
		{
			tasks_title += ' Not numeric.';
		}
		tasks += ':';
		this.elTasks.textContent = tasks;
		this.elTasks.title = tasks_title;

		if( this.service != this.params.service )
		{
			this.service = this.params.service;
			this.elIcon.src = 'icons/software/'+this.service+'.png';
		}
		this.elIcon.title = this.service;

		var deps = '';
		var deps_title = ''
		if( this.params.depend_mask )
		{
			deps += ' [' + this.params.depend_mask + ']';
			if( deps_title.length ) deps_title += '\n';
			deps_title += 'Depend mask = \"' + this.params.depend_mask + '\".'
		}
		if( this.params.tasks_depend_mask )
		{
			deps += ' T[' + this.params.tasks_depend_mask + ']';
			if( deps_title.length ) deps_title += '\n';
			deps_title += 'Tasks depend mask = \"' + this.params.tasks_depend_mask + '\".'
		}
		if( this.params.depend_sub_task )
		{
			deps += ' [SUB]';
			if( deps_title.length ) deps_title += '\n';
			deps_title += 'Subtasks depend.'
		}
		this.elDepends.textContent = deps;
		this.elDepends.title = deps_title;

		this.elCapacity.textContent = '[' + this.params.capacity + ']';

		var errTxt = '';
		var errTit = '';
		var eah = -1, eth = -1, ert = -1;
		if( this.params.errors_avoid_host ) eah = this.params.errors_avoid_host;
		if( this.params.errors_task_same_host) eth = this.params.errors_task_same_host;
		if( this.params.errors_retries) ert = this.params.errors_retries;
		if(( eah != -1 ) || ( eth != -1 ) || ( ert != -1 ))
		{
			errTxt = 'Err:';
			errTit = 'Errors Solving:';

			errTxt += eah + 'J';
			errTit += '\nAvoid Job Block: ' + eah;
			if( eah == 0 ) errTit = ' (unlimited)';
			else if( eah == -1 ) errTit = ' (user settings used)';

			errTxt += ',' + eth + 'T';
			errTit += '\nAvoid Task Same Host: ' + eth;
			if( eth == 0 ) errTit = ' (unlimited)';
			else if( eth == -1 ) errTit = ' (user settings used)';

			errTxt += ',' + ert + 'R';
			errTit += '\nTask Errors Retries: ' + ert;
			if( ert == 0 ) errTit = ' (unlimited)';
			else if( ert == -1 ) errTit = ' (user settings used)';
		}
		this.elErrSolving.textContent = errTxt;
		this.elErrSolving.title = errTit;

		if(( this.params.errors_forgive_time != null ) && ( this.params.errors_forgive_time >= 0 ))
			this.elForgiveTime.textContent = 'F'+cm_TimeStringFromSeconds( this.params.errors_forgive_time);
		else this.elForgiveTime.textContent = '';

		if( this.params.tasks_max_run_time != null )
			this.elMaxRunTime.textContent = 'MRT'+cm_TimeStringFromSeconds( this.params.tasks_max_run_time);
		else this.elMaxRunTime.textContent = '';

		if( this.params.max_running_tasks != null )
			this.elMaxRunTasks.textContent = 'Max'+this.params.max_running_tasks;
		else this.elMaxRunTasks.textContent = '';

		if( this.params.max_running_tasks_per_host != null )
			this.elMaxRunTasksPH.textContent = 'MPH'+this.params.max_running_tasks_per_host;
		else this.elMaxRunTasksPH.textContent = '';

		if( this.params.hosts_mask)
			this.elHostsMask.textContent = 'H('+this.params.hosts_mask+')';
		else this.elHostsMask.textContent = '';

		if( this.params.hosts_mask_exclude)
			this.elHostsMaskExclude.textContent = 'E('+this.params.hosts_mask_exclude+')';
		else this.elHostsMaskExclude.textContent = '';

		if( this.params.need_memory)
			this.elNeedMem.textContent = 'RAM'+this.params.need_memory;
		else this.elNeedMem.textContent = '';

		if( this.params.need_hdd)
			this.elNeedHDD.textContent = 'HDD'+this.params.need_hdd;
		else this.elNeedHDD.textContent = '';

		if( this.params.need_power)
			this.elNeedPower.textContent = 'Pow'+this.params.need_power;
		else this.elNeedPower.textContent = '';

		if( this.params.need_properties)
			this.elNeedProperties.textContent = this.params.need_properties;
		else this.elNeedProperties.textContent = '';

		if( this.params.p_tasks_run_time && this.params.p_tasks_done )
		{
			var sum = cm_TimeStringFromSeconds( this.params.p_tasks_run_time);
			var avg = cm_TimeStringFromSeconds( Math.round( this.params.p_tasks_run_time / this.params.p_tasks_done));
			this.elRunTime.textContent = sum +'/'+avg;
			this.elRunTime.title = 'Running Time:\nTotal: '+sum+'\nAverage per task: '+avg;
		}
		else
		{
			this.elRunTime.textContent = '';
			this.elRunTime.title = '';
		}
	}

	if( this.displayFull )
	{
		var percentage = 0;
		if( this.params.p_percentage ) percentage = this.params.p_percentage;
		this.elPercentage.textContent = percentage + '%';

		var tasks_done = 0;
		if( this.params.p_tasks_done ) tasks_done = this.params.p_tasks_done;
		this.elTasksDon.textContent = 'don:'+tasks_done;

		var tasks_rdy = 0;
		if( this.params.p_tasks_ready ) tasks_rdy = this.params.p_tasks_ready;
		this.elTasksRdy.textContent = 'rdy:'+tasks_rdy;

		var tasks_run = 0;
		if( this.params.running_tasks_counter )
		{
			tasks_run = this.params.running_tasks_counter;
			this.elTasksRun.textContent = 'run:'+tasks_run;
		}
		else this.elTasksRun.textContent = '';

		var tasks_err = 0;
		if( this.params.p_tasks_error )
		{
			tasks_err = this.params.p_tasks_error;
			this.elTasksErr.textContent = 'err:'+tasks_err;
			this.elTasksErr.style.display = 'inline';
		}
		else
		{
			this.elTasksErr.textContent = '';
			this.elTasksErr.style.display = 'none';
		}

		var tasks_skp = 0;
		if( this.params.p_tasks_skipped )
		{
			tasks_skp = this.params.p_tasks_skipped;
			this.elTasksSkp.textContent = 'skp:'+tasks_skp;
		}
		else this.elTasksSkp.textContent = '';

		var tasks_wrn = 0;
		if( this.params.p_tasks_warning )
		{
			tasks_wrn = this.params.p_tasks_warning;
			this.elTasksWrn.textContent = 'wrn:'+tasks_wrn;
		}
		else this.elTasksWrn.textContent = '';

		var he_txt = '', he_tit = '';
		this.elErrHosts.classList.remove('ERR');
		if( this.params.p_error_hosts )
		{
			he_txt = 'Eh' + this.params.p_error_hosts;
			he_tit = 'Error Hosts: ' + this.params.p_error_hosts;
			if( this.params.p_avoid_hosts )
			{
				he_txt += ': ' + this.params.p_avoid_hosts + ' Avoid';
				he_tit += '\nAvoiding Hosts: ' + this.params.p_avoid_hosts;
				this.elErrHosts.classList.add('ERR');
			}
		}
		this.elErrHosts.textContent = he_txt;
		this.elErrHosts.title = he_tit;

		this.elBarPercentage.style.width = percentage + '%';
		this.elBarDone.style.width = Math.floor( 100 * tasks_done / this.tasks_num ) + '%';
		this.elBarErr.style.width = Math.ceil( 100 * tasks_err / this.tasks_num ) + '%';
		this.elBarRun.style.width = Math.ceil( 100 * tasks_run / this.tasks_num ) + '%';

		if( this.params.p_progressbar )
		{
			var ctx = this.canvas.getContext('2d');
			ctx.clearRect( 0, 0, Block_ProgressBarLength, Block_ProgressBarHeight);
			ctx.lineWidth = 1;
			ctx.lineCap = 'square';
			for( var i = 0; i < Block_ProgressBarLength; i++ )
			{
				var rgb = '#000';
				switch( this.params.p_progressbar.charAt(i) )
				{
					case 'r': continue; // RDY
					case 'D': rgb = BarDONrgb; break;
					case 'S': rgb = BarSKPrgb; break;// SKP
					case 'G': rgb = BarDWRrgb; break;// DON | WRN
					case 'W': rgb = BarWDPrgb; break;// WDP
					case 'R': rgb = BarRUNrgb; break;// RUN
					case 'N': rgb = BarRWRrgb; break;// RUN | WRN
					case 'E': rgb = BarERRrgb; break;// ERR
				}
				ctx.strokeStyle = rgb;
				ctx.beginPath();
				ctx.moveTo( i+.5, 0);
				ctx.lineTo( i+.5, Block_ProgressBarHeight);
				ctx.stroke();
			}
		}
	}
}

JobNode.resetPanels = function( i_monitor)
{
	i_monitor.ctrl_btns.errors.classList.remove('errors');
	i_monitor.ctrl_btns.errors.classList.add('hide_childs');

	// Remove folders items:
	var elFolders = i_monitor.elPanelR.m_elFolders;
	if( elFolders.m_elFolders )
		for( var i = 0; i < elFolders.m_elFolders.length; i++)
			elFolders.removeChild( elFolders.m_elFolders[i]);
	elFolders.m_elFolders = [];
	elFolders.m_elRules.style.display = 'none';
}
JobNode.prototype.updatePanels = function()
{
	var elPanelL = this.monitor.elPanelL;
	var elPanelR = this.monitor.elPanelR;


	// Admin can't move jobs:
	if( g_VISOR())
		this.monitor.ctrl_btns.move_jobs.classList.remove('active');


	// Blocks:
	JobBlock.deselectAll( this.monitor);
	elPanelR.m_elBlocks.classList.remove('active');


	// Errors control buttons:
	var errors = 0;
	var avoids = 0;
	for( var b = 0; b < this.params.blocks.length; b++)
	{
		var block = this.params.blocks[b];
		if( block.p_error_hosts )
			errors += block.p_error_hosts;
		if( block.p_avoid_hosts )
			avoids += block.p_avoid_hosts;
	}
	if( errors || avoids || this.state.ERR )
	{
		this.monitor.ctrl_btns.errors.classList.remove('hide_childs');
		if( avoids || this.state.ERR )
			this.monitor.ctrl_btns.errors.classList.add('errors');
	}
	else
	{
		this.monitor.ctrl_btns.errors.classList.remove('active');
	}


	// Info:
	var info = 'Created:<br> ' + cm_DateTimeStrFromSec( this.params.time_creation);
	if( this.params.time_started )
		info += '<br>Started:<br> ' + cm_DateTimeStrFromSec( this.params.time_started);
	if( this.params.time_done )
		info += '<br>Finished:<br> ' + cm_DateTimeStrFromSec( this.params.time_done);
	this.monitor.setPanelInfo( info);


	// Folders:
	var elFolders = elPanelR.m_elFolders;
	elFolders.m_elFolders = [];
	var folders = this.params.folders;

//console.log(JSON.stringify( folders));
	if(( folders == null ) || ( folders.length == 0 ))
	{
		return;
	}

	var rules_link = folders.output;

	for( var name in folders )
	{
		if( rules_link == null )
			rules_link = folders[name];

		var path = cgru_PM( folders[name]);

		var elDiv = document.createElement('div');
		elFolders.appendChild( elDiv);
		elFolders.m_elFolders.push( elDiv);
		elDiv.classList.add('param');
		elDiv.classList.add('folder');
		elDiv.classList.add('cmdexec');
		var cmd = cgru_OpenFolderCmd( path);
		elDiv.setAttribute('cmdexec', JSON.stringify([cmd]));
		elDiv.title = 'Right click and "Run" to open:\n' + path;

		var elLabel = document.createElement('div');
		elDiv.appendChild( elLabel);
		elLabel.classList.add('label');
		elLabel.textContent = name;

		var elValue = document.createElement('div');
		elDiv.appendChild( elValue);
		elValue.classList.add('value');
		elValue.textContent = path;
	}

	elFolders.m_elRules.style.display = 'block';
	elFolders.m_elRules.href = cgru_RulesLink( rules_link);
}

JobNode.createPanels = function( i_monitor)
{
	// Left Panel:


	// Errors:
	var acts = {};
	acts.error_hosts       = {'label':'GEH', "handle":'mh_Get',  'tooltip':'Show error hosts.'};
	acts.reset_error_hosts = {'label':'REH', 'handle':'mh_Oper', 'tooltip':'Reset error hosts.'};
	acts.restart_errors    = {'label':'RET', 'handle':'mh_Oper', 'tooltip':'Restart error tasks.'};
	i_monitor.createCtrlBtn({'name':'errors','label':'ERR','tooltip':'Error tasks and hosts.','sub_menu':acts});


	// Restart:
	var acts = {};
	acts.restart         = {'label':'ALL', 'tooltip':'Restart all tasks.'};
	acts.restart_pause   = {'label':'A&P', 'tooltip':'Restart all and pause.'};
	acts.restart_errors  = {'label':'ERR', 'tooltip':'Restart error tasks.'};
	acts.restart_running = {'label':'RUN', 'tooltip':'Restart running tasks.'};
	acts.restart_skipped = {'label':'SKP', 'tooltip':'Restart skipped tasks.'};
	acts.restart_done    = {'label':'DON', 'tooltip':'Restart done task.'};
	i_monitor.createCtrlBtn({'name':'restart_tasks','label':'RES','tooltip':'Restart job tasks.','sub_menu':acts});


	// Move:
	var acts = {};
	acts.move_jobs_top    = {'label':'TOP','tooltip':'Move jobs top.'};
	acts.move_jobs_up     = {'label':'UP', 'tooltip':'Move jobs up.'};
	acts.move_jobs_down   = {'label':'DWN','tooltip':'Move jobs down.'};
	acts.move_jobs_bottom = {'label':'BOT','tooltip':'Move jobs bottom.'};
	i_monitor.createCtrlBtn({'name':'move_jobs','label':'MOV','tooltip':'Move jobs.','sub_menu':acts,'handle':'moveJobs'});


	// Actions:
	var acts = {};
	acts.start  = {"label":"STA","tooltip":'Start job.'};
	acts.pause  = {"label":"PAU","tooltip":'Pause job.'};
	acts.stop   = {"label":"STP","tooltip":'Double click to stop job running tasks.',"ondblclick":true};
	acts.delete = {"label":"DEL","tooltip":'Double click delete job(s).',"ondblclick":true};
	i_monitor.createCtrlBtns( acts);


	// Right Panel:
	var elPanelR = i_monitor.elPanelR;


	// Folders:
	var el = document.createElement('div');
	elPanelR.appendChild( el);
	el.classList.add('section');
	el.classList.add('folders');
	elPanelR.m_elFolders = el;
	var el = document.createElement('a');
	elPanelR.m_elFolders.appendChild( el);
	elPanelR.m_elFolders.m_elRules = el;
	el.classList.add('rules_link');
	el.classList.add('caption');
	el.title = 'Open RULES shot in a new window(tab).';
	el.textContent = 'RULES';
	el.setAttribute('target','_blank');
	var el = document.createElement('div');
	elPanelR.m_elFolders.appendChild( el);
	el.textContent = 'Folders';
	el.classList.add('caption');


	// Blocks:
	var el = document.createElement('div');
	elPanelR.appendChild( el);
	el.classList.add('section');
	el.classList.add('blocks');
	elPanelR.m_elBlocks = el;
	var elCaption = document.createElement('div');
	elPanelR.m_elBlocks.appendChild( elCaption);
	elCaption.textContent = 'Blocks';
	elCaption.classList.add('caption');

	var elName = document.createElement('div');
	elPanelR.m_elBlocks.appendChild( elName);
	elPanelR.m_elBlocks.m_elName = elName;
	elName.classList.add('name');
	elName.style.display = 'none';

	elPanelR.m_elBlocks.m_elParams = {};
	for( var p in JobBlock.params )
	{
		var elDiv = document.createElement('div');
		elPanelR.m_elBlocks.appendChild( elDiv);
		elPanelR.m_elBlocks.m_elParams[p] = elDiv;
		elDiv.classList.add('param');
		elDiv.style.display = 'none';

		var elLabel = document.createElement('div');
		elDiv.appendChild( elLabel);
		elLabel.classList.add('label');
		elLabel.textContent = JobBlock.params[p].label;

		var elValue = document.createElement('div');
		elDiv.appendChild( elValue);
		elDiv.m_elValue = elValue;
		elValue.classList.add('value');

		var el = elDiv;
		el.title = 'Double click to edit.'
		el.monitor = i_monitor;
		el.name = p;
		el.param = JobBlock.params[p];
		el.monitor = i_monitor;
		el.ondblclick = function(e){
			var el = e.currentTarget;
			JobBlock.setDialog({'name':el.name,'type':el.param.type,'monitor':el.monitor});
		}
	}

	var el = elCaption;
	el.title = 'Click to edit all paramters.';
	el.m_elBlocks = elPanelR.m_elBlocks;
	el.onclick = function(e){
		var el = e.currentTarget;
		if( el.m_elBlocks.classList.contains('active') != true ) return false;
		var elParams = el.m_elBlocks.m_elParams;
		for( var p in elParams )
			elParams[p].style.display = 'block';
		return false;
	}
}

JobNode.moveJobs = function( i_args)
{
	nw_Action('users', [g_uid], {'type':i_args.name,'jids':i_args.monitor.getSelectedIds()});
	i_args.monitor.info('Moving Jobs');
}

JobNode.params = {};
JobNode.params.priority =                   {"type":'num', "label":'Priority'};
JobNode.params.depend_mask =                {"type":'reg', "label":'Depend Mask'};
JobNode.params.depend_mask_global =         {"type":'reg', "label":'Global Depend Mask'};
JobNode.params.max_running_tasks =          {"type":'num', "label":'Max Runnig Tasks'};
JobNode.params.max_running_tasks_per_host = {"type":'num', "label":'Max Run Tasks Per Host'};
JobNode.params.hosts_mask =                 {"type":'reg', "label":'Hosts Mask'};
JobNode.params.hosts_mask_exclude =         {"type":'reg', "label":'Exclude Hosts Mask'};
JobNode.params.time_wait =                  {"type":'tim', "label":'Time Wait'};
JobNode.params.need_os =                    {"type":'reg', "label":'OS Needed'};
JobNode.params.need_properties =            {"type":'reg', "label":'Need Properties'};
JobNode.params.time_life =                  {"type":'hrs', "label":'Life Time'};
JobNode.params.annotation =                 {"type":'str', "label":'Annotation'};
JobNode.params.hidden =                     {"type":'bl1', "label":'Hidden'};
JobNode.params.ppa =                        {"type":'bl1', "label":'Preview Pending Approval'};
JobNode.params.user_name =                  {"type":'str', "label":'Owner',"permissions":'visor'};

JobNode.view_opts = {};
JobNode.view_opts.jobs_thumbs_num =    {"type":'num',"label":"TQU","tooltip":'Thumbnails quantity.',"default":12  };
JobNode.view_opts.jobs_thumbs_height = {"type":'num',"label":"THE","tooltip":'Thumbnails height.',  "default":100 };


JobBlock.params = {};
JobBlock.params.capacity                   = {"type":'num', "label":'Capacity'};
JobBlock.params.sequential                 = {"type":'num', "label":'Sequential'};
JobBlock.params.max_running_tasks          = {"type":'num', "label":'Max Runnig Tasks'};
JobBlock.params.max_running_tasks_per_host = {"type":'num', "label":'Max Run Tasks Per Host'};
JobBlock.params.errors_retries             = {"type":'num', "label":'Errors Retries'};
JobBlock.params.errors_avoid_host          = {"type":'num', "label":'Errors Avoid Host'};
JobBlock.params.errors_task_same_host      = {"type":'num', "label":'Errors Task Same Host'};
JobBlock.params.errors_forgive_time        = {"type":'hrs', "label":'Errors Forgive Time'};
JobBlock.params.tasks_max_run_time         = {"type":'hrs', "label":'Tasks Max Run Time'};
JobBlock.params.hosts_mask                 = {"type":'reg', "label":'Hosts Mask'};
JobBlock.params.hosts_mask_exclude         = {"type":'reg', "label":'Exclude Hosts Mask'};
JobBlock.params.depend_mask                = {"type":'reg', "label":'Depend Mask'};
JobBlock.params.tasks_depend_mask          = {"type":'reg', "label":'Tasks Depend Mask'};
JobBlock.params.need_properties            = {"type":'reg', "label":'Properties Needed'};

// First array item will be used by default (on load)
JobNode.sort = ['order','time_creation','priority','user_name','name','host_name'];
JobNode.sortVisor = 'time_creation';
// If user is visor, special parameter will be used as the default
JobNode.filter = ['name','host_name','user_name'];
JobNode.filterVisor = 'user_name';

