import FetchComponent from './FetchComponent'
import Heart from './Heart'
import PlayButton from './PlayButton'
import PostFooter from './PostFooter'
import PostHeader from './PostHeader'
import PostMedia from './PostMedia'
import Save from './Save' // @todo: when handleEvent works again, remove this
import bind from 'autobind-decorator'
import { Fragment, h } from 'preact'

export default class Post extends FetchComponent {
	state = {
		hasLiked: false,
		hasSaved: false,
	}

	constructor(props) {
		super(props)

		const {
			data: { id = null, viewer_has_liked = false, viewer_has_saved = false },
		} = this.props

		this.state.hasLiked = viewer_has_liked
		this.state.hasSaved = viewer_has_saved
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return true
		//if (this.state.active !== nextState.active) return true
		//return false
	}

	@bind
	handleSave() {
		this.setState(
			prevState => ({ hasSaved: !prevState.hasSaved }),
			async () => {
				const result = await this.post(this.state.hasSaved ? 'unsave' : 'save')
				if (result.status !== 'ok') this.setState({ hasSaved: false })
			}
		)
	}

	@bind
	handleLike() {
		this.setState(
			prevState => ({ hasLiked: !prevState.hasLiked }),
			async () => {
				const result = await this.post(this.state.hasLiked ? 'unlike' : 'like')
				if (result.status !== 'ok') this.setState({ hasLiked: false })
			}
		)
	}

	post(action) {
		const path = action.indexOf('like') !== -1 ? 'likes' : action.replace('un', '') // like -> likes; unsave -> save; ...

		return this.fetch(`/web/${path}/${this.props.data.id}/${action}/`, {
			headers: this.getHeaders(true),
			method: 'POST',
		})
	}

	returnLiked(edge_media_preview_like) {
		return (
			<>
				♥{' '}
				{edge_media_preview_like?.edges?.map(v => {
					const username = v.node.username
					return (
						<>
							<a class="" title={username} href={'/' + username + '/'}>
								<img class="ige_picture_container ige_picture_container-small va-text-top" src={v.node.profile_pic_url} decoding="async" />{' '}
								{username}
							</a>
							,{' '}
						</>
					)
				})}
				{edge_media_preview_like?.count?.toLocaleString()}
			</>
		)
	}

	handleAddComment() {}

	render() {
		/**
		 * Unused keys:
		 * follow_hashtag_info // 1
		 * user.is_verified // !
		 * attribution // !
		 * edge_media_preview_comment.has_next_page, end_cursor // !
		 * "gating_info": null, // !
      "fact_check_overall_rating": null, // !
			"fact_check_information": null, // !
			edge_media_to_sponsor_user // !
			viewer_has_saved_to_collection // !
			viewer_in_photo_of_you
			user:
				followed_by_viewer // !
				is_private				// !
		 
				requested_by_viewer
				blocked_by_viewer
				has_blocked_viewer
				restricted_by_viewer
		 */
		const {
			data: {
				owner = {},
				taken_at_timestamp = 0,
				location = null,
				edge_media_to_caption = null,
				id = null,
				shortcode = '',
				comments_disabled = true,
				edge_media_preview_like = null,
				edge_media_preview_comment = null,
				is_video = false,
				video_view_count = 0,
			},
			data,
		} = this.props
		const text = edge_media_to_caption?.edges[0]?.node?.text

		const { hasLiked, hasSaved } = this.state

		return (
			<article class={`ige_post ${is_video ? 'ige_post_video' : ''}`} id={`post_${id}`}>
				<PostHeader user={owner} shortcode={shortcode} taken_at={taken_at_timestamp} location={location} />
				<PostMedia data={data} />
				<div class="d-flex f-row a-center px-12 ige_actions_container">
					<button type="button" class="ige_button" onClick={this.handleLike}>
						<Heart width={24} height={24} fill="#262626" active={hasLiked} />
					</button>
					<button type="button" class="ige_button" onClick={this.handleSave}>
						<Save width={24} height={24} active={hasSaved} />
					</button>
					<div class="ml-auto d-block">
						{is_video ? (
							<>
								<PlayButton fill="black" /> {video_view_count.toLocaleString()}
							</>
						) : (
							this.returnLiked(edge_media_preview_like)
						)}
					</div>
				</div>
				<div class="ige_post-content px-12">
					{text !== undefined ? (
						<div class="ige_post-text d-block">
							<a class="" title={owner.username} href={'/' + owner.username + '/'}>
								{owner.username}
							</a>
							<span class="pl-2 ige_text">{text}</span>
						</div>
					) : null}
					<PostFooter id={id} canComment={!comments_disabled} onComment={this.handleAddComment} comments={edge_media_preview_comment} />
				</div>
			</article>
		)
	}
}