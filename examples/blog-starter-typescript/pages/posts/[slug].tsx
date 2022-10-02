import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Container from '../../components/container'
import PostBody from '../../components/post-body'
import Header from '../../components/header'
import PostHeader from '../../components/post-header'
import Layout from '../../components/layout'
import { getPostBySlug, getAllPosts } from '../../lib/api'
import PostTitle from '../../components/post-title'
import Head from 'next/head'
import { CMS_NAME } from '../../lib/constants'
import markdownToHtml from '../../lib/markdownToHtml'
import PostType from '../../types/post'
import { useCallback, useEffect, useState } from 'react'
import { reactLocalStorage } from 'reactjs-localstorage'

type Props = {
  post: PostType
  morePosts: PostType[]
  preview?: boolean
}

const Post = ({ post, morePosts, preview }: Props) => {
  const router = useRouter()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const isLoggedIn = reactLocalStorage.get('isLoggedIn', false)
    setIsLoggedIn(isLoggedIn)
  }, [])

  const onUsernameChange = useCallback((e) => {
    setUsername(e.target.value)
  }, [])

  const onPasswordChange = useCallback((e) => {
    setPassword(e.target.value)
  }, [])

  const handleLogin = useCallback(() => {
    if (username === 'complete' && password === 'complete') {
      reactLocalStorage.set('isLoggedIn', true)
      setIsLoggedIn(true)
    } else {
      alert('You have entered wrong username or password')
    }
  }, [username, password])

  const renderLoginModal = post.isPremium ? !isLoggedIn : false

  if (renderLoginModal) {
    return (
      <div>
        <span>Please log in to see article about {post.title}</span>
        <div style={{ marginTop: 10 }}>
          <input
            type="text"
            value={username}
            onChange={onUsernameChange}
            style={{ borderWidth: 1 }}
          />
          <input
            type="password"
            value={password}
            onChange={onPasswordChange}
            style={{ borderWidth: 1 }}
          />
          <button onClick={handleLogin}>Log In</button>
        </div>
      </div>
    )
  }

  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <Layout preview={preview}>
      <Container>
        <Header />
        {router.isFallback ? (
          <PostTitle>Loading…</PostTitle>
        ) : (
          <>
            <article className="mb-32">
              <Head>
                <title>
                  {post.title} | Next.js Blog Example with {CMS_NAME}
                </title>
                <meta property="og:image" content={post.ogImage.url} />
              </Head>
              <PostHeader
                title={post.title}
                coverImage={post.coverImage}
                date={post.date}
                author={post.author}
              />
              <PostBody content={post.content} />
            </article>
          </>
        )}
      </Container>
    </Layout>
  )
}

export default Post

type Params = {
  params: {
    slug: string
  }
}

export async function getStaticProps({ params }: Params) {
  const post = getPostBySlug(params.slug, [
    'title',
    'date',
    'slug',
    'author',
    'content',
    'ogImage',
    'coverImage',
    'isPremium',
  ])
  const content = await markdownToHtml(post.content || '')

  return {
    props: {
      post: {
        ...post,
        content,
      },
    },
  }
}

export async function getStaticPaths() {
  const posts = getAllPosts(['slug'])

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      }
    }),
    fallback: false,
  }
}
