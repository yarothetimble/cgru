#include "itemuser.h"

#include "../libafanasy/environment.h"

#include "../libafqt/qenvironment.h"

#include "ctrlsortfilter.h"
#include "watch.h"

#include <QtCore/QEvent>
#include <QtGui/QPainter>

#define AFOUTPUT
#undef AFOUTPUT
#include "../include/macrooutput.h"

const int ItemUser::HeightUser = 30;
const int ItemUser::HeightAnnotation = 14;

ItemUser::ItemUser( af::User *user):
	ItemNode( (af::Node*)user)
{
	updateValues( user, 0);
}

ItemUser::~ItemUser()
{
}

void ItemUser::updateValues( af::Node *node, int type)
{
	af::User * user = (af::User*)node;

	updateNodeValues( node);

	hostname             = afqt::stoq( user->getHostName());
	numjobs              = user->getNumJobs();
	numrunningtasks      = user->getRunningTasksNumber();
	maxrunningtasks      = user->getMaxRunningTasks();
	hostsmask            = afqt::stoq( user->getHostsMask());
	hostsmask_exclude    = afqt::stoq( user->getHostsMaskExclude());
	errors_avoidhost     = user->getErrorsAvoidHost();
	errors_tasksamehost  = user->getErrorsTaskSameHost();
	errors_retries       = user->getErrorsRetries();
	errors_forgivetime   = user->getErrorsForgiveTime();
	jobs_lifetime        = user->getJobsLifeTime();
	time_register        = user->getTimeRegister();
	time_activity        = user->getTimeActivity();

	if( numrunningtasks )
		setRunning();
	else
		setNotRunning();

	strLeftTop = QString("%1-%2").arg(m_name).arg( m_priority);
	if( isLocked()) strLeftTop = "(LOCK) " + strLeftTop;

	strLeftBottom  = 'j' + QString::number( numjobs) + '/' + QString::number( user->getNumRunningJobs());

	strHCenterTop.clear();
	if( maxrunningtasks != -1) strHCenterTop  = QString("m%1").arg( maxrunningtasks );
	if( false == hostsmask.isEmpty()       )  strHCenterTop += QString(" H(%1)").arg( hostsmask         );
	if( false == hostsmask_exclude.isEmpty()) strHCenterTop += QString(" E(%1)").arg( hostsmask_exclude );
	strHCenterTop += QString(" %1").arg( user->generateErrorsSolvingString().c_str());
	if( jobs_lifetime > 0 ) strHCenterTop += QString(" L%1").arg( af::time2strHMS( jobs_lifetime, true).c_str());

	strRightTop = hostname;

	if( user->solveJobsParallel())
	{
		strRightBottom = "Par";
	}
	else
	{
		strRightBottom = "Ord";
	}

	tooltip = user->v_generateInfoString( true).c_str();

	calcHeight();
}

bool ItemUser::calcHeight()
{
	int old_height = m_height;
	m_height = HeightUser;
	if( false == m_annotation.isEmpty()) m_height += HeightAnnotation;
	return old_height == m_height;
}

void ItemUser::paint( QPainter *painter, const QStyleOptionViewItem &option) const
{
	drawBack( painter, option);
	int x = option.rect.x() + 5;
	int y = option.rect.y() + 2;
	int w = option.rect.width() - 10;
	int h = option.rect.height() - 4;
	int height_user = HeightUser-4;

	painter->setPen( clrTextMain( option) );
	painter->setFont( afqt::QEnvironment::f_name);
	painter->drawText( x, y, w, h, Qt::AlignLeft | Qt::AlignTop,     strLeftTop);

	painter->setPen( clrTextInfo( option) );
	painter->setFont( afqt::QEnvironment::f_info);
	painter->drawText( x, y, w, height_user, Qt::AlignLeft    | Qt::AlignBottom,  strLeftBottom  );
	painter->drawText( x, y, w, height_user, Qt::AlignHCenter | Qt::AlignTop,     strHCenterTop  );
	painter->drawText( x, y, w, height_user, Qt::AlignRight   | Qt::AlignBottom,  strRightBottom );
	painter->setPen( afqt::QEnvironment::qclr_black );
	painter->drawText( x, y, w, height_user, Qt::AlignRight   | Qt::AlignTop,     strRightTop    );

	if( false == m_annotation.isEmpty())
		painter->drawText( x, y, w, h, Qt::AlignBottom | Qt::AlignHCenter, m_annotation );

	{  // draw stars:
		static const int stars_size = 8;
		static const int stars_height = 21;
		static const int stars_left = 35;
		static const int stars_maxdelta = stars_size * 2 + 5;

		int quantity = numrunningtasks;
		//quantity = 155;

		if( quantity > 0)
		{
			int numstars = quantity;
			int stars_right = w - 50;
			int stars_delta = (stars_right - stars_left) / numstars;
			if( stars_delta < 1 )
			{
				stars_delta = 1;
				numstars = stars_right - stars_left;
			}
			else if( stars_delta > stars_maxdelta ) stars_delta = stars_maxdelta;
			int sx = x + stars_left;
			for( int j = 0; j < numstars; j++)
			{
				drawStar( stars_size, sx, y + stars_height, painter);
				sx += stars_delta;
			}

			painter->setFont( afqt::QEnvironment::f_name);
			painter->setPen( afqt::QEnvironment::clr_textstars.c);
			painter->drawText( x, y, w, HeightUser, Qt::AlignHCenter | Qt::AlignBottom, QString::number(numrunningtasks));
		}
	}

	drawPost( painter, option);
}

bool ItemUser::setSortType(   int type )
{
	resetSorting();
	switch( type )
	{
		case CtrlSortFilter::TNONE:
			return false;
		case CtrlSortFilter::TPRIORITY:
			sort_int = m_priority;
			break;
		case CtrlSortFilter::TNAME:
			sort_str = m_name;
			break;
		case CtrlSortFilter::THOSTNAME:
			sort_str = hostname;
			break;
		case CtrlSortFilter::TNUMJOBS:
			sort_int = numjobs;
			break;
		case CtrlSortFilter::TNUMRUNNINGTASKS:
			sort_int = numrunningtasks;
			break;
		case CtrlSortFilter::TTIMEREGISTERED:
			sort_int = time_register;
			break;
		case CtrlSortFilter::TTIMEACTIVITY:
			sort_int = time_activity;
			break;
		default:
			AFERRAR("ItemUser::setSortType: Invalid type number = %d", type)
			return false;
	}
	return true;
}

bool ItemUser::setFilterType( int type )
{
	resetFiltering();
	switch( type )
	{
		case CtrlSortFilter::TNONE:
			return false;
		case CtrlSortFilter::TNAME:
			filter_str = m_name;
			break;
		case CtrlSortFilter::THOSTNAME:
			filter_str = hostname;
			break;
		default:
			AFERRAR("ItemUser::setFilterType: Invalid type number = %d", type)
			return false;
	}
	return true;
}
