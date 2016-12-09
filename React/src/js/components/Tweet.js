import React from "react"

export default class Tweet extends React.Component {
  render() {
    return (
      <li>
        <h1>{this.props.text}</h1>
      </li>
    ) 
  }
}
