function UserNode() {}

UserNode.prototype.init = function() 
{
	this.element.classList.add('user');

	this.elName = document.createElement('span');
	this.elName.classList.add('name');
	this.element.appendChild( this.elName);
	this.elName.title = 'User name';

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

	this.elMaxRunningTasks = cm_ElCreateText( this.elCenter, 'Maximum Running Tasks');
	this.elHostsMask = cm_ElCreateText( this.elCenter, 'Hosts Mask');
	this.elHostsMaskExclude = cm_ElCreateText( this.elCenter, 'Exclude Hosts Mask');
	this.elErrors = cm_ElCreateText( this.elCenter);
	this.elForgive = cm_ElCreateText( this.elCenter, 'Errors Forgive Time');
	this.elJobsLifeTime = cm_ElCreateText( this.elCenter, 'Jobs Life Time');

	this.element.appendChild( document.createElement('br'));

	this.elJobs = cm_ElCreateFloatText( this.element, 'left', 'Jobs: All/Running');

	this.elSolving = cm_ElCreateFloatText( this.element, 'right');

	this.element.appendChild( document.createElement('br'));

	this.elAnnotation = document.createElement('div');
	this.element.appendChild( this.elAnnotation);
	this.elAnnotation.title = 'Annotation';
	this.elAnnotation.style.textAlign = 'center';

	this.elBarParent = document.createElement('div');
	this.element.appendChild( this.elBarParent);
	this.elBarParent.style.position = 'absolute';
	this.elBarParent.style.left = '50px';
	this.elBarParent.style.right = '50px';
	this.elBarParent.style.top = '18px';
	this.elBarParent.style.height = '12px';

	this.elBar = document.createElement('div');
	this.elBarParent.appendChild( this.elBar);
	this.elBar.classList.add('bar');
//	this.elBar.style.textAlign = 'right';
}

UserNode.prototype.update = function()
{
	this.elName.innerHTML = this.params.name;

	this.elPriority.innerHTML = '-' + this.params.priority;

	if( this.params.host_name ) this.elHostName.innerHTML = this.params.host_name;
	else this.elHostName.innerHTML = '';

	if( this.params.max_running_tasks ) this.elMaxRunningTasks.innerHTML = 'Max('+this.params.max_running_tasks+')';
	else this.elMaxRunningTasks.innerHTML = '';

	if( this.params.hosts_mask ) this.elHostsMask.innerHTML = 'H('+this.params.hosts_mask+')';
	else this.elHostsMask.innerHTML = '';

	if( this.params.hosts_mask_exclude ) this.elHostsMaskExclude.innerHTML = 'E('+this.params.hosts_mask+')';
	else this.elHostsMaskExclude.innerHTML = '';

	if( this.params.errors_forgive_time ) this.elForgive.innerHTML = 'F'+ cm_TimeStringFromSeconds( this.params.errors_forgive_time);
	else this.elForgive.innerHTML = '';

	if( this.params.jobs_life_time ) this.elJobsLifeTime.innerHTML = 'L'+ cm_TimeStringFromSeconds( this.params.jobs_life_time);
	else this.elJobsLifeTime.innerHTML = '';

	var errstr = 'Err:';
	var errtit = 'Errors solving:';
	errstr += this.params.errors_avoid_host + 'J-';
	errtit += '\nJob blocks to avoid host: ' + this.params.errors_avoid_host;
	errstr += this.params.errors_task_same_host + 'T-';
	errtit += '\nJob tasks to avoid host: ' + this.params.errors_task_same_host;
	errstr += this.params.errors_retries + 'R';
	errtit += '\nError task retries: ' + this.params.errors_retries;
	this.elErrors.innerHTML = errstr;
	this.elErrors.title = errtit;

	var jobs = 'j';
	if( this.params.jobs_num)
		jobs += this.params.jobs_num;
	else
		jobs += '0';
	jobs += '/';
	if( this.params.running_jobs_num )
		jobs += this.params.running_jobs_num;
	else
		jobs += '0';
	if( this.params.running_tasks_num )
		jobs += '-' + this.params.running_tasks_num;
	this.elJobs.innerHTML = jobs;

	var solving = 'User jobs solving method:';
	if( this.params.solve_parallel )
	{
		this.elSolving.innerHTML = 'Par';
		solving += '\nParallel: All together accoring to jobs priority.\n';
	}
	else
	{
		this.elSolving.innerHTML = 'Ord';
		solving += '\nOrdered: One by one accoring to jobs priority and order.\n';
	}
	this.elSolving.title = solving;

	if( this.params.annotation )
		this.elAnnotation.innerHTML = this.params.annotation;
	else
		this.elAnnotation.innerHTML = '';

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
	this.elBar.innerHTML = label;
}

UserNode.prototype.onDoubleClick = function()
{
}
