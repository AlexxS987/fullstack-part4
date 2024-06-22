const _ = require('lodash')

const dummy = (blogs) => {
  blogs
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce(( likes, blog ) => likes + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  const mostLikes = blogs.reduce((prev, current) =>
    (prev.likes > current.likes) ? prev : current
  )
  return {
    title: mostLikes.title,
    author: mostLikes.author,
    likes: mostLikes.likes
  }
}

const mostBlogs = (blogs) => {
  const authorCounts = _.countBy(blogs, 'author')
  const maxBlogs = _.max(Object.values(authorCounts))
  const author = Object.keys(authorCounts).find(key => authorCounts[key] === maxBlogs)
  return {
    author: author,
    blogs: maxBlogs
  }
}

const mostLikes = (blogs) => {
  const authorBlogs = _.groupBy(blogs, 'author')
  const likesPerAuthor = _.map(authorBlogs, (blogs, author) => ({
    author: author,
    likes: _.sumBy(blogs, 'likes')
  }))
  return _.maxBy(likesPerAuthor, 'likes')
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}