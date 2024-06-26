const { test, describe, after, beforeEach  } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')

describe('when there is initially some notes saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
  })

  describe('GET requests', () => {
    test('all blogs are returned as json', async () => {
      const response = await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('each blog has an id', async () => {
      const response = await api.get('/api/blogs')

      const everyBlogHasId = response.body.every(blog => 'id' in blog)

      assert(everyBlogHasId)
    })
  })

  describe('good POST requests', () => {
    test('a valid blog can be added', async () => {
      const newBlog = {
        _id: '5a422b3a1b54a676234d17f9',
        title: 'Canonical string reduction',
        author: 'Edsger W. Dijkstra',
        url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
        likes: 12,
        __v: 0
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

      const contents = blogsAtEnd.map(b => b.title)
      assert(contents.includes('Canonical string reduction'))
    })
  })

  describe('malformed POST requests', () => {
    test('blog without likes property defaults to 0', async () => {
      const newBlog = {
        _id: '5a422b3a1b54a676234d17f9',
        title: 'Canonical string reduction',
        author: 'Edsger W. Dijkstra',
        url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
        __v: 0
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

      const addedBlog = blogsAtEnd.find(b => b.title === 'Canonical string reduction')
      assert.strictEqual(addedBlog.likes, 0)
    })

    test('blog with missing title return 400', async () => {
      const newBlog = {
        _id: '5a422b3a1b54a676234d17f9',
        author: 'Edsger W. Dijkstra',
        url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
        likes: 12,
        __v: 0
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)
        .expect((response) => {
          assert(response.error, 'Blog validation failed: title: Path `title` is required.')
        })

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('blog with missing url return 400', async () => {
      const newBlog = {
        _id: '5a422b3a1b54a676234d17f9',
        title: 'Canonical string reduction',
        author: 'Edsger W. Dijkstra',
        likes: 12,
        __v: 0
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)
        .expect((response) => {
          assert(response.error, 'Blog validation failed: url: Path `url` is required.')
        })

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })

  describe('DELETE requests', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

      const contents = blogsAtEnd.map(b => b.title)
      assert(!contents.includes(blogToDelete.title))
    })
  })

  describe('PUT requests', () => {
    test('succeeds with status code 200 if id is valid', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]
      const updatedBlog = {
        _id: '5a422a851b54a676234d17f7',
        title: 'React patterns',
        author: 'Michael Chan',
        url: 'https://reactpatterns.com/',
        likes: 10,
        __v: 0
      }

      await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlog)
        .expect(200)

      const blogsAtEnd = await helper.blogsInDb()

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
      assert.strictEqual(blogsAtEnd[0].likes, 10)
    })

    test('fails with status code 400 if id is not valid', async () => {
      const updatedBlog = {
        _id: '5a422a851b54a676234d17f7',
        title: 'React patterns',
        author: 'Michael Chan',
        url: 'https://reactpatterns.com/',
        likes: 10,
        __v: 0
      }

      await api
        .put('/api/blogs/1')
        .send(updatedBlog)
        .expect(400)
        .expect((response) => {
          assert(response.error, 'malformatted id')
        })

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})