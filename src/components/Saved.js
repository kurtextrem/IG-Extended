import Loading from './Loading'
import PostsContainer from './PostsContainer'
import bind from 'autobind-decorator'
import { Component, h } from 'preact'
import { NavItem, NavLink } from 'reactstrap'
import { Storage, fetchFromBackground } from './Utils'
import { Suspense } from 'preact/compat'
import { getActive } from './Nav'

/**
 *
 */
export function renderCollection(items, type) {
	if (!items || !items.length) return null

	const result = []
	for (let i = 0; i < items.length; ++i) {
		const item = items[i]
		const link = `#/collection/${item.collection_id}`

		if (type === 'render')
			result.push(
				<a key={item.collection_id} href={link} class="collection">
					<div class="collection--image">
						<img src={item.cover_media.image_versions2.candidates[0].url} alt={item.collection_name} />
					</div>
					<div class="collection--title">{item.collection_name}</div>
					<div class="collection--footer">{item.collection_media_count}</div>
				</a>
			)
		else
			result.push(
				<NavItem>
					<NavLink class={getActive(window.location.hash, link)} href={link}>
						{item.collection_name}
					</NavLink>
				</NavItem>
			)
	}

	return result
}

export default class Saved extends Component {
	state = { items: [] }

	@bind
	async getItems() {
		// @TODO Implement more_available
		const now = Date.now()
		const collections = await Storage.get('collections', null) // {items: [], date: int}

		if (collections === null || now - collections.date > 300000) {
			// 5min
			try {
				const json = await fetchFromBackground('private_web', 'collections/list/')
				const items = json.items ? json.items : []
				for (let i = 0; i < items.length; ++i) {
					const item = items[i],
						cover_media = item.cover_media?.image_versions2?.candidates?.[0]
					if (!cover_media || !cover_media.url) {
						item.cover_media = { image_versions2: { candidates: [{ url: '' }] } }
						continue
					}
					item.cover_media.image_versions2.candidates = [cover_media] // save storage
				}

				Storage.set('collections', { date: now, items })
				this.setItems(items)
			} catch (e) {
				Storage.set('collections', { date: now, items: [] })
				console.error('no collections', e)
			}
			return
		}
		//const req = await fetch('../collectionList.json')
		//const json = await req.json()
		this.setItems(collections.items)
	}

	setItems(items) {
		this.setState({ items })
	}

	componentDidMount() {
		this.getItems()
	}

	shouldComponentUpdate(nextProps, nextState) {
		const id = this.props.id
		if (nextState.items.length !== this.state.items.length) return true
		if (id === nextProps.id) return false
		return true
	}

	render() {
		const id = this.props.id

		if (id === undefined) {
			const collections = renderCollection(this.state.items, 'render')
			return (
				<Suspense fallback={<Loading />}>
					<div class="d-flex w-100 justify-content-center flex-wrap">
						{collections}
						{collections !== null ? <i class="w-100 text-center">(middle- or right-click to open a collection in a new tab)</i> : null}
						<PostsContainer key="saved" id="saved" defaultClass="turned_in" toggleClass="turned_in_not" preload={2} />
					</div>
				</Suspense>
			)
		}

		const key = 'collection/' + id()
		return <PostsContainer key={key} id={key} defaultClass="turned_in" toggleClass="turned_in_not" preload={3} />
	}
}
