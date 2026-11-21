async function fetchResourceJson(url) {
	const response = await fetch(url, { credentials: 'same-origin' })
	if (!response.ok) throw new Error(`HTTP ${response.status}`)
	return response.json()
}

export async function getCoursewareUploads(activityId) {
	const activity = await fetchResourceJson(`/api/activities/${activityId}?sub_course_id=0`)
	return (activity.uploads || []).filter((upload) => !upload.deleted)
}

export async function getCoursewareResource(activityId, upload) {
	const params = new URLSearchParams({
		refer_id: activityId,
		refer_type: 'learning_activity'
	})
	let url
	let name = upload.name || `resource-${upload.id}`
	if (upload.type === 'document') {
		params.set('preview', 'true')
		const reference = upload.reference_id ? '/reference' : ''
		const uploadId = encodeURIComponent(upload.reference_id || upload.id)
		const data = await fetchResourceJson(
			`/api/uploads${reference}/document/${uploadId}/url?${params}`
		)
		if (!data.url) throw new Error('尚無可用的文件資源連結')
		url = data.url
		const pathname = new URL(url, window.location.origin).pathname
		if (/\.pdf$/i.test(pathname) && !/\.pdf$/i.test(name)) {
			name = `${name.replace(/\.[^.]+$/, '')}.pdf`
		}
	} else {
		if (!upload.allow_download) throw new Error('此資源未提供下載')
		url = `/api/uploads/${encodeURIComponent(upload.id)}/blob?${params}`
	}
	const resolvedUrl = new URL(url, window.location.origin)
	if (!['http:', 'https:'].includes(resolvedUrl.protocol)) {
		throw new Error('資源連結格式不支援')
	}
	return { name, url: resolvedUrl.href }
}

export async function downloadCoursewareResource(resource) {
	const response = await fetch(resource.url, { credentials: 'same-origin' })
	if (!response.ok) throw new Error(`HTTP ${response.status}`)
	if (response.headers.get('content-type')?.includes('text/html')) {
		throw new Error('伺服器回傳網頁，請確認登入狀態')
	}
	const url = URL.createObjectURL(await response.blob())
	const link = document.createElement('a')
	link.href = url
	link.download = resource.name
	document.body.appendChild(link)
	link.click()
	link.remove()
	setTimeout(() => URL.revokeObjectURL(url), 60000)
}
