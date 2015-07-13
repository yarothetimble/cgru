function UserNode() {}

UserNode.prototype.init = function() 
{
	this.element.classList.add('user');

	cm_CreateStart( this);

	this.elName = document.createElement('span');
	this.elName.classList.add('name');
	this.element.appendChild( this.elName);
	this.elName.title = 'User Name';
	this.elName.classList.add('prestar');

	this.elPriority = document.createElement('span');
	this.element.appendChild( this.elPriority);
	this.elPriority.title = 'Priority';

	this.elHostName = cm_ElCreateFloatText( this.element, 'right', 'Host Name');
	this.elHostName.classList.add('name');

	this.elCenter = document.createElement('div');
	this.element.appendChild( this.elCenter);
	this.elCenter.style.position = 'absolute';
	this.elCenter.style.left = '0';
	this.elCenter.style.right = '0';
	this.elCenter.style.top = '1px';
	this.elCenter.style.textAlign = 'center';
	this.elCenter.classList.add('prestar');

	this.elMaxRunningTasks = cm_ElCreateText( this.elCenter, 'Maximum Running Tasks');
	this.elHostsMask = cm_ElCreateText( this.elCenter, 'Hosts Mask');
	this.elHostsMaskExclude = cm_ElCreateText( this.elCenter, 'Exclude Hosts Mask');
	this.elErrors = cm_ElCreateText( this.elCenter);
	this.elForgive = cm_ElCreateText( this.elCenter, 'Errors Forgive Time');
	this.elJobsLifeTime = cm_ElCreateText( this.elCenter, 'Jobs Life Time');

	this.element.appendChild( document.createElement('br'));

	this.elJobs = cm_ElCreateFloatText( this.element, 'left', 'Jobs: All/Running');
	this.elJobs.classList.add('prestar');

	this.elSolving = cm_ElCreateFloatText( this.element, 'right');

	this.element.appendChild( document.createElement('br'));

	this.elAnnotation = document.createElement('div');
	this.element.appendChild( this.elAnnotation);
	this.elAnnotation.title = 'Annotation';
	this.elAnnotation.style.textAlign = 'center';
	this.elAnnotation.classList.add('prestar');

	this.elBarParent = document.createElement('div');
	this.element.appendChild( this.elBarParent);
	this.elBarParent.style.position = 'absolute';
	this.elBarParent.style.left = '120px';
	this.elBarParent.style.right = '50px';
	this.elBarParent.style.top = '18px';
	this.elBarParent.style.height = '12px';

	this.elBar = document.createElement('div');
	this.elBarParent.appendChild( this.elBar);
	this.elBar.classList.add('bar');
//	this.elBar.style.textAlign = 'right';
}

UserNode.prototype.update = function( i_obj)
{
	if( i_obj ) this.params = i_obj;

	this.elName.textContent = this.params.name;

	this.elPriority.textContent = '-' + this.params.priority;

	if( this.params.host_name ) this.elHostName.textContent = this.params.host_name;
	else this.elHostName.textContent = '';

	if( this.params.max_running_tasks ) this.elMaxRunningTasks.textContent = 'Max('+this.params.max_running_tasks+')';
	else this.elMaxRunningTasks.textContent = '';

	if( this.params.hosts_mask ) this.elHostsMask.textContent = 'H('+this.params.hosts_mask+')';
	else this.elHostsMask.textContent = '';

	if( this.params.hosts_mask_exclude ) this.elHostsMaskExclude.textContent = 'E('+this.params.hosts_mask_exclude+')';
	else this.elHostsMaskExclude.textContent = '';

	if( this.params.errors_forgive_time ) this.elForgive.textContent = 'F'+ cm_TimeStringFromSeconds( this.params.errors_forgive_time);
	else this.elForgive.textContent = '';

	if( this.params.jobs_life_time ) this.elJobsLifeTime.textContent = 'L'+ cm_TimeStringFromSeconds( this.params.jobs_life_time);
	else this.elJobsLifeTime.textContent = '';

	if( this.params.running_tasks_num )
	{
		this.elStar.style.display = 'block';
		this.elStarCount.textContent = this.params.running_tasks_num;
	}
	else
		this.elStar.style.display = 'none';

	var errstr = 'Err:';
	var errtit = 'Errors solving:';
	errstr += this.params.errors_avoid_host + 'J,';
	errtit += '\nJob blocks to avoid host: ' + this.params.errors_avoid_host;
	errstr += this.params.errors_task_same_host + 'T,';
	errtit += '\nJob tasks to avoid host: ' + this.params.errors_task_same_host;
	errstr += this.params.errors_retries + 'R';
	errtit += '\nError task retries: ' + this.params.errors_retries;
	this.elErrors.textContent = errstr;
	this.elErrors.title = errtit;

	var jobs = 'j';
	if( this.params.jobs_num)
		jobs += this.params.jobs_num;
	else
		jobs += '0';
	if( this.params.running_jobs_num )
		jobs += '/'+this.params.running_jobs_num;
//	if( this.params.running_tasks_num )
//		jobs += '-' + this.params.running_tasks_num;
	this.elJobs.textContent = jobs;

	var solving = 'User jobs solving method:';
	if( this.params.solve_parallel )
	{
		this.elSolving.textContent = 'Par';
		solving += '\nParallel: All together according to jobs priority.\n';
	}
	else
	{
		this.elSolving.textContent = 'Ord';
		solving += '\nOrdered: Queued by jobs priority and order.\n';
	}
	this.elSolving.title = solving;

	if( this.params.annotation )
		this.elAnnotation.textContent = this.params.annotation;
	else
		this.elAnnotation.textContent = '';

	var title = '';
	title += 'Time Registered: ' + cm_DateTimeStrFromSec( this.params.time_register) + '\n';
	title += 'Last Acitvity: ' + cm_DateTimeStrFromSec( this.params.time_activity) + '\n';
	title += 'ID = ' + this.params.id + '\n';
//	this.elName.title = title;
	this.element.title = title;

	this.refresh();
}

UserNode.prototype.refresh = function()
{
	var percent = '';
	var label = '';
	if( this.params.running_tasks_num && ( this.monitor.max_tasks > 0 ))
	{
		percent = 100 * this.params.running_tasks_num/this.monitor.max_tasks;
		label = this.params.running_tasks_num;
	}
	else
		percent = '0';
	this.elBar.style.width = percent + '%';
	this.elBar.textContent = label;
//window.console.log(this.params.name+'-'+percent+'% ('+this.monitor.type+'_max='+this.monitor.max_tasks+')')
}


UserNode.createPanels = function( i_monitor)
{
	// Jobs solving:
	var acts = {};
	acts.solve_ord = {'name':'solve_parallel','value':false,'label':'ORD','tooltip':'Solve jobs by order.','handle':'mh_Param'};
	acts.solve_par = {'name':'solve_parallel','value':true, 'label':'PAR','tooltip':'Solve jobs parallel.','handle':'mh_Param'};
	//i_monitor.createCtrlBtn({'name':'solve','label':'SLV','tooltip':'Jobs solving method.','sub_menu':acts});
	i_monitor.createCtrlBtns( acts);


	// Custom data:
	var acts = {};
	acts.custom_data = {'type':'json','handle':'mh_Dialog','label':'DAT','tooltip':'Set user custom data.'};
	i_monitor.createCtrlBtns( acts);
}


UserNode.prototype.updatePanels = function()
{
	// Info:
	var info = 'Registered:<br> ' + cm_DateTimeStrFromSec( this.params.time_register);
	if( this.params.time_activity )
		info += '<br>Last Activity:<br> ' + cm_DateTimeStrFromSec( this.params.time_activity);
	this.monitor.setPanelInfo( info);
}


UserNode.prototype.onDoubleClick = function( e) { g_ShowObject({"object":this.params},{"evt":e,"wnd":this.monitor.window});}


UserNode.params = {};
UserNode.params.priority              = {'type':'num','label':'Priority'};
UserNode.params.max_running_tasks     = {'type':'num','label':'Max Runnig Tasks'};
UserNode.params.hosts_mask            = {'type':'reg','label':'Hosts Mask'};
UserNode.params.hosts_mask_exclude    = {'type':'reg','label':'Exclude Hosts Mask'};
UserNode.params.errors_retries        = {'type':'num','label':'Errors Retries'};
UserNode.params.errors_avoid_host     = {'type':'num','label':'Errors Avoid Host'};
UserNode.params.errors_task_same_host = {'type':'num','label':'Errors Task Same Host'};
UserNode.params.errors_forgive_time   = {'type':'hrs','label':'Errors Forgive Time'};
UserNode.params.jobs_life_time        = {'type':'hrs','label':'Jobs Life Time'};
UserNode.params.annotation            = {'type':'str','label':'Annotation'};
//UserNode.params.custom_data           = {'type':'json','label':'Custom Data'};


UserNode.sort = ['priority','name','host_name'];
UserNode.filter = ['name','host_name'];

