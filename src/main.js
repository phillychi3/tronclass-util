import { mount } from 'svelte'
import { disableVideoJSFocusDetection } from './lib/focus.js'
import { waitForSelector, waitForElement, contains } from './lib/utils.js'
import { tglobal } from './lib/store.svelte.js'
import {
	getCoursewareUploads,
	getCoursewareResource,
	downloadCoursewareResource
} from './lib/courseware.js'
import VideoPanel from './components/VideoPanel.svelte'
import FilePanel from './components/FilePanel.svelte'

if (
	document.URL.match(
		/https?:\/\/eclass.yuntech.edu.tw\/course\/[0-9]{1,6}\/learning-activity(#)?\/(full-screen)?/
	)
) {
	disableVideoJSFocusDetection()
}

function modifyLearningActivities() {
	const learningActivities = document.querySelectorAll('.learning-activity')
	learningActivities.forEach((activity) => {
		const activityId = activity.id.replace('learning-activity-', '')
		const clickableArea = activity.querySelector('.clickable-area')
		if (clickableArea) {
			const newClickableArea = clickableArea.cloneNode(true)
			clickableArea.parentNode.replaceChild(newClickableArea, clickableArea)
			const courseId = window.location.pathname.split('/')[2]
			newClickableArea.addEventListener('click', (e) => {
				e.preventDefault()
				e.stopPropagation()
				window.open(
					`https://eclass.yuntech.edu.tw/course/${courseId}/learning-activity#/${activityId}`,
					'_blank'
				)
			})
			newClickableArea.style.cursor = 'pointer'
		}
	})
}

function modifycourseware() {
	const learningActivities = document.querySelectorAll('.learning-activity')
	learningActivities.forEach((activity) => {
		const activityId = activity.id.replace('learning-activity-', '')
		const clickableArea = activity.querySelector('.clickable-area')
		if (clickableArea) {
			const newClickableArea = clickableArea.cloneNode(true)
			clickableArea.parentNode.replaceChild(newClickableArea, clickableArea)
			const courseId = window.location.pathname.split('/')[2]
			newClickableArea.addEventListener('click', (e) => {
				e.preventDefault()
				e.stopPropagation()
				window.open(
					`https://eclass.yuntech.edu.tw/course/${courseId}/learning-activity#/${activityId}`,
					'_blank'
				)
			})
			newClickableArea.style.cursor = 'pointer'
		}
	})
}

function downloadallcourseware() {
	const target = document.querySelector('.content-under-nav-2.with-loading.row')
	if (!target || document.getElementById('loltron-courseware-download-all')) return

	const downloadbutton = document.createElement('div')
	downloadbutton.innerHTML = `
    <button class="btn btn-default" id="loltron-courseware-download-all">download all courseware</button>
  `
	target.parentNode.insertBefore(downloadbutton, target)

	const button = downloadbutton.querySelector('button')
	const status = document.createElement('div')
	status.setAttribute('role', 'status')
	const links = document.createElement('ul')
	downloadbutton.append(status, links)

	button.addEventListener('click', async () => {
		button.disabled = true
		links.replaceChildren()
		let downloaded = 0
		let failed = 0
		const seen = new Set()
		const activityIds = Array.from(
			new Set(
				Array.from(target.querySelectorAll('.learning-activity[id]'))
					.map((activity) => activity.id.match(/^learning-activity-(\d+)$/)?.[1])
					.filter(Boolean)
			)
		)
		try {
			for (const [index, activityId] of activityIds.entries()) {
				status.textContent = `取得教材資源 ${index + 1}/${activityIds.length}…`
				let uploads
				try {
					uploads = await getCoursewareUploads(activityId)
				} catch (error) {
					failed++
					const item = document.createElement('li')
					item.textContent = `教材 ${activityId}：${error.message}`
					links.appendChild(item)
					continue
				}
				for (const upload of uploads) {
					const key = upload.reference_id ? `reference-${upload.reference_id}` : upload.id
					if (key != null && seen.has(key)) continue
					if (key != null) seen.add(key)
					const item = document.createElement('li')
					links.appendChild(item)
					try {
						const resource = await getCoursewareResource(activityId, upload)
						const link = document.createElement('a')
						link.href = resource.url
						link.textContent = resource.name
						link.target = '_blank'
						link.rel = 'noopener noreferrer'
						item.appendChild(link)
						await downloadCoursewareResource(resource)
						downloaded++
					} catch (error) {
						failed++
						if (!item.firstChild) item.textContent = upload.name || `資源 ${upload.id}`
						item.append(`：${error.message}；若有連結可點擊開啟`)
					}
				}
			}
			status.textContent = activityIds.length
				? `已送出 ${downloaded} 個下載，${failed} 項失敗。資源連結列於下方。`
				: '找不到教材，請等列表載入後再試。'
		} finally {
			button.disabled = false
		}
	})
}
function modifyhomework() {
	document.querySelectorAll('[ng-repeat*="homework in homeworkList"]').forEach((el) => {
		const homeworkId = angular.element(el).scope().homework.id
		const clickableArea = el.querySelector('.clickable-area')
		if (clickableArea) {
			const newClickableArea = clickableArea.cloneNode(true)
			clickableArea.parentNode.replaceChild(newClickableArea, clickableArea)
			const courseId = window.location.pathname.split('/')[2]
			newClickableArea.addEventListener('click', (e) => {
				e.preventDefault()
				e.stopPropagation()
				window.open(
					`https://eclass.yuntech.edu.tw/course/${courseId}/learning-activity#/${homeworkId}`,
					'_blank'
				)
			})
			newClickableArea.style.cursor = 'pointer'
		}
	})
}

function removefooter() {
	const footer = document.getElementsByClassName('footer')
	if (footer) {
		footer[0].style.display = 'none'
	}
}

function makeweekvideopanel() {
	const syllabus = document.getElementsByClassName('syllabus-list')
	Array.from(syllabus).forEach((element) => {
		const titleElement = element.querySelector('.title.ng-binding')
		if (titleElement && titleElement.innerText === '影音教材') {
			const activities = element.parentElement.getElementsByClassName('learning-activity')
			const activityIds = Array.from(activities)
				.map((activity) => {
					const match = activity.id.match(/learning-activity-(\d+)/)
					return match ? match[1] : null
				})
				.filter((id) => id !== null)

			const button = document.createElement('button')
			button.className = 'button-green'
			button.innerText = '觀看這周'
			button.style.marginRight = '10px'

			button.addEventListener('click', (event) => {
				event.stopPropagation()
				if (tglobal.courseispress) return
				tglobal.courseispress = true

				const container = document.createElement('div')
				container.style.cssText = 'display:flex;align-items:center;gap:10px;'
				button.parentNode.insertBefore(container, button)
				container.appendChild(button)

				const loader = document.createElement('div')
				loader.innerHTML = `
					<style>
						.loltron-loader {
							width: 30px; height: 30px; border: 5px solid #0000; box-sizing: border-box;
							background:
								radial-gradient(farthest-side,#000 98%,#0000) 0 0/5px 5px,
								radial-gradient(farthest-side,#000 98%,#0000) 100% 0/5px 5px,
								radial-gradient(farthest-side,#000 98%,#0000) 100% 100%/5px 5px,
								radial-gradient(farthest-side,#000 98%,#0000) 0 100%/5px 5px,
								linear-gradient(#000 0 0) 50%/10px 10px, #fff;
							background-repeat: no-repeat;
							filter: blur(2px) contrast(10);
							animation: loltron-l12 0.8s infinite;
						}
						@keyframes loltron-l12 { 100% { background-position:100% 0,100% 100%,0 100%,0 0,center } }
					</style>
					<div class="loltron-loader"></div>
				`
				container.appendChild(loader)

				alert(
					'自動觀看即將執行 請勿觸碰頁面，第一次使用請手動同意跳出過多窗口(瀏覽器右上角會有警示，並且重新執行自動觀看)，如有頁面長時間並無自動關閉請重新整理並手動按下觀看按鈕'
				)

				activityIds.forEach((id, index) => {
					setTimeout(() => {
						window.open(
							`https://eclass.yuntech.edu.tw/course/${globalData.course.id}/learning-activity/full-screen#/${id}?autowatch=true`
						)
					}, index * 6000)
				})

				setTimeout(() => {
					tglobal.courseispress = false
					loader.style.display = 'none'
				}, activityIds.length * 6000)
			})

			titleElement.parentNode.appendChild(button)
		}
	})
}

function makecoursepanel() {
	const target = document.querySelector('.collapse')
	if (!target) return

	const panel = document.createElement('div')
	panel.innerHTML = `
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a class="collapsed" data-toggle="collapse" data-parent="#accordion" aria-expanded="false">tronclass util</a>
				</h4>
			</div>
			<div class="buttons" id="loltron-course-buttons">
				<button class="btn btn-default" id="loltron-course-btn1">watch all video (not finish)</button>
				<button class="btn btn-default" id="loltron-course-btn2">wait...</button>
			</div>
		</div>
	`
	target.parentNode.insertBefore(panel, target)

	document
		.getElementById('loltron-course-btn1')
		?.addEventListener('click', () => console.log('click1'))
	document
		.getElementById('loltron-course-btn2')
		?.addEventListener('click', () => console.log('click2'))
}

async function makevideopanel() {
	const target = await waitForSelector('.video-player-section')
	if (!target) {
		console.error('makevideopanel: .video-player-section not found')
		return
	}
	const container = document.createElement('div')
	target.parentNode.insertBefore(container, target.nextSibling)
	mount(VideoPanel, { target: container })
}

async function makefilepanel() {
	const target = await waitForSelector('div.fullscreen-right')
	if (!target) {
		console.error('makefilepanel: div.fullscreen-right not found')
		return
	}
	const container = document.createElement('div')
	target.appendChild(container)
	mount(FilePanel, { target: container })
}

const observer = new MutationObserver(resetTimer)
let timer = setTimeout(action, 1000, observer)
observer.observe(document, { childList: true, subtree: true })

function resetTimer(changes, observer) {
	clearTimeout(timer)
	timer = setTimeout(action, 1000, observer)
}

async function action(observer) {
	observer.disconnect()
	removefooter()
	if (document.URL.match(/https?:\/\/eclass.yuntech.edu.tw\/course\/[0-9]{1,6}\/content(#)?\//)) {
		makecoursepanel()
		makeweekvideopanel()
		modifyLearningActivities()
	} else if (
		document.URL.match(
			/https?:\/\/eclass.yuntech.edu.tw\/course\/[0-9]{1,6}\/learning-activity(#)?\/(full-screen)?/
		)
	) {
		const hasWatchRequirement = await waitForElement('span', '需累積觀看')
		if (hasWatchRequirement) await makevideopanel()

		const hasDownloadOption = await waitForElement('span', '觀看或下載')
		if (hasDownloadOption) await makefilepanel()
	} else if (
		document.URL.match(/https?:\/\/eclass.yuntech.edu.tw\/course\/[0-9]{1,6}\/courseware(#)?\//)
	) {
		downloadallcourseware()
		modifycourseware()
	} else if (
		document.URL.match(/https?:\/\/eclass.yuntech.edu.tw\/course\/[0-9]{1,6}\/homework(#)?\//)
	) {
		modifyhomework()
	}
	observer.observe(document, { childList: true, subtree: true })
}

console.log(
	'%c eclass Util %c https://github.com/phillychi3/loltronclass ',
	'color: white; background: #e9546b; padding:5px 0;',
	'padding:4px;border:1px solid #e9546b;'
)
