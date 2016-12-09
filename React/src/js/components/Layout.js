import React from "react"
import { connect } from "react-redux"

import Tweet from "./Tweet.js"
import Footer from "./Footer.js"
import Header from "./Header.js"

import { fetchUser } from "../actions/userActions"
import { fetchTweets } from "../actions/tweetsActions"

@connect((store) => {
  return {
    user: store.user.user,
    userFetched: store.user.fetched,
    tweets: store.tweets.tweets,
  };
})
export default class Layout extends React.Component {
  componentWillMount() {
    this.props.dispatch(fetchUser())
  }

  fetchTweets() {
    this.props.dispatch(fetchTweets())
  }

  render() {
    const { user, tweets } = this.props;

    if (!tweets.length) {
      return <button onClick={this.fetchTweets.bind(this)}>load tweets</button>
    }

    const mappedTweets = tweets.map(tweet => {
        return <Tweet text={tweet.text} key={tweet.id} />
    })

    return <div>
      <Header />
      <h1>{user.name}</h1>
      <ul>{mappedTweets}</ul>
      <Footer />
    </div>
  }
}
